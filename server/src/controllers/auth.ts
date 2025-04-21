import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";
import { BadRequestError, NotFoundError } from "../errors/http.errors";
import * as bcrypt from "bcryptjs";
import { RefreshToken } from "../entities/RefreshToken";
import { AppDataSource } from "../data-source";
import { asyncHandler } from "../utils/async-handler";
import { randomBytes } from "crypto";
import { PasswordReset } from "../entities/PasswordReset";
import emailTransporter from "../lib/emailTransporter";

export class AuthController {
  private format = (data: User) => {
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      phone: data.phone,
      email: data.email,
      isAdmin:data.isAdmin,
      profileUrl: data?.profileUrl,
      branch:data.branch,
      role:data.role,
      group:data.group
    };
  };

  currentUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      const foundUser = await User.findOne({
        where: {
          id: user.id,
        },
        relations: ["role", "branch", "group"]
      });

      if (!foundUser) throw new NotFoundError("User not found");

      res.json(this.format(foundUser));
    }
  );

  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Validate request body
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({
        where: { email: email },
        select: ["id", "name", "profileUrl", "email", "password"],
      });

      if (!user) {
        throw new BadRequestError("Invalid credentials", {
          errors: {
            email: "User with email is not found",
          },
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new BadRequestError("Invalid credentials", {
          errors: {
            password: "Password is incorrect.",
          },
        });
      }

      const userObj = {
        id: user.id,
        email: user.email,
        name: user.name,
        profileUrl: user.profileUrl,
      };

      // Generate JWT token
      const access_token = jwt.sign(userObj, process.env.JWT_SECRET, {
        expiresIn: "7h",
      });

      const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

      // Save refresh token to database
      const newRefreshToken = new RefreshToken();
      newRefreshToken.token = refresh_token;
      newRefreshToken.user = user;
      newRefreshToken.expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ); // 7 days
      await refreshTokenRepository.save(newRefreshToken);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        ...this.format(user),
        access_token,
        isNew: false,
      });
    }
  );

  forgotPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw new BadRequestError("Invalid email", {
          errors: {
            email: "User with email does not exist",
          },
        });
      }

      // Generate reset token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Save reset token
      const passwordReset = new PasswordReset();
      passwordReset.token = token;
      passwordReset.user = user;
      passwordReset.expiresAt = expiresAt;

      const passwordResetRepository =
        AppDataSource.getRepository(PasswordReset);
      passwordResetRepository.save(passwordReset);

      // Send email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Password Reset Request",
        html: `
                    <h1>Password Reset Request</h1>
                    <p>You requested to reset your password. Click the link below to reset it:</p>
                    <a href="${resetLink}">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `,
      });

      return res.status(200).json({
        status: "success",
        message:
          "If an account exists with this email, a reset link will be sent",
      });
    }
  );

  resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const passwordResetRepository =
        AppDataSource.getRepository(PasswordReset);
      const userRepository = AppDataSource.getRepository(User);
      const { token, password: newPassword } = req.body;

      if (!token || !newPassword) {
        throw new BadRequestError("Token and new password are required");
      }

      // Find valid reset token
      const passwordReset = await passwordResetRepository.findOne({
        where: { token },
        relations: ["user"],
      });

      if (!passwordReset || passwordReset.expiresAt < new Date()) {
        throw new BadRequestError("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      const user = passwordReset.user;
      user.password = hashedPassword;
      await userRepository.save(user);

      // Delete used reset token
      await passwordResetRepository.remove(passwordReset);

      // Optionally, invalidate all refresh tokens for this user
      await passwordResetRepository
        .createQueryBuilder()
        .delete()
        .from(PasswordReset)
        .where("userId = :userId", { userId: user.id })
        .execute();

      return res.status(200).json({
        status: "success",
        message: "Password has been reset successfully",
      });
    }
  );
}
