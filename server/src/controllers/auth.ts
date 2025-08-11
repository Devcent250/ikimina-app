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
import { Member } from "../entities/Member";

export class AuthController {
  private format = (data: User) => {
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      phone: data.phone,
      email: data.email,
      isAdmin: data.isAdmin,
      profileUrl: data?.profileUrl,
      branch: data.branch,
      role: data.role,
      group: data.group,
    };
  };

  currentUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      // Try to find user in User table first
      let foundUser = await User.findOne({
        where: {
          id: user.id,
        },
        relations: ["role", "branch", "group"],
      });

      if (foundUser) {
        return res.json(this.format(foundUser));
      }

      // If not found in User table, try Member table (for leaders)
      const foundMember = await Member.findOne({
        where: {
          id: user.id,
        },
        relations: ["groupMemberships", "groupMemberships.group", "groupMemberships.group.president", "groupMemberships.group.accountant", "groupMemberships.group.secretary"],
      });

      if (!foundMember) {
        throw new NotFoundError("User not found");
      }

      // Determine leader role by checking group memberships
      let leaderRole = null;
      console.log("Checking leader role for member:", foundMember.id, foundMember.fullNames);
      console.log("Group memberships:", foundMember.groupMemberships);

      if (foundMember.groupMemberships && foundMember.groupMemberships.length > 0) {
        const groupMembership = foundMember.groupMemberships[0];
        console.log("Group membership:", groupMembership);

        if (groupMembership.group) {
          // Check if this member is a leader in any group
          const group = groupMembership.group;
          console.log("Group:", group);
          console.log("Group president:", group.president);
          console.log("Group accountant:", group.accountant);
          console.log("Group secretary:", group.secretary);

          if (group.president?.id === foundMember.id) {
            leaderRole = "President";
            console.log("Found as President");
          } else if (group.accountant?.id === foundMember.id) {
            leaderRole = "Accountant";
            console.log("Found as Accountant");
          } else if (group.secretary?.id === foundMember.id) {
            leaderRole = "Secretary";
            console.log("Found as Secretary");
          }
        }
      }

      console.log("Final leader role:", leaderRole);

      // Format member data similar to user data
      const memberData = {
        id: foundMember.id,
        name: foundMember.fullNames,
        email: foundMember.email,
        phone: foundMember.phone,
        status: foundMember.isActive ? "active" : "inactive",
        role: leaderRole ? { name: leaderRole } : null,
        isAdmin: false,
        type: "member",
        group: foundMember.groupMemberships?.[0]?.group || null,
      };

      console.log("CurrentUser - Final memberData being sent:", JSON.stringify(memberData, null, 2));
      res.json(memberData);
    }
  );

  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Validate request body
      const { email, password } = req.body;

      // Try Member first (for leaders) - prioritize members over users
      const member = await Member.findOne({
        where: { email: email },
        select: ["id", "fullNames", "email", "password", "isActive"],
        relations: ["groupMemberships", "groupMemberships.group", "groupMemberships.group.president", "groupMemberships.group.accountant", "groupMemberships.group.secretary"],
      });

      if (member && member.password) {
        const isValidPassword = await bcrypt.compare(password, member.password);
        if (!isValidPassword) {
          throw new BadRequestError("Invalid credentials", {
            errors: {
              password: "Password is incorrect.",
            },
          });
        }
        // Only allow active members
        if (member.isActive === false) {
          throw new BadRequestError("Account is inactive", {
            errors: {
              email: "Account is inactive.",
            },
          });
        }
        // Determine leader role by checking group memberships
        let leaderRole = null;
        console.log("Login - Checking leader role for member:", member.id, member.fullNames);
        console.log("Login - Group memberships:", member.groupMemberships);

        if (member.groupMemberships && member.groupMemberships.length > 0) {
          const groupMembership = member.groupMemberships[0];
          console.log("Login - Group membership:", groupMembership);

          if (groupMembership.group) {
            // Check if this member is a leader in any group
            const group = groupMembership.group;
            console.log("Login - Group:", group);
            console.log("Login - Group president:", group.president);
            console.log("Login - Group accountant:", group.accountant);
            console.log("Login - Group secretary:", group.secretary);

            if (group.president?.id === member.id) {
              leaderRole = "President";
              console.log("Login - Found as President");
            } else if (group.accountant?.id === member.id) {
              leaderRole = "Accountant";
              console.log("Login - Found as Accountant");
            } else if (group.secretary?.id === member.id) {
              leaderRole = "Secretary";
              console.log("Login - Found as Secretary");
            }
          }
        }

        console.log("Login - Final leader role:", leaderRole);

        const memberObj = {
          id: member.id,
          email: member.email,
          name: member.fullNames,
          isActive: member.isActive,
          role: leaderRole ? { name: leaderRole } : null,
          isAdmin: false,
          type: "member",
        };

        console.log("Login - Final memberObj being sent:", JSON.stringify(memberObj, null, 2));
        const access_token = jwt.sign(memberObj, process.env.JWT_SECRET, {
          expiresIn: "7h",
        });
        // Optionally, you can implement refresh tokens for members as well
        return res.json({
          status: "success",
          access_token,
          user: memberObj,
        });
      }

      // Try User (for admins and regular users)
      let user = await User.findOne({
        where: { email: email },
        select: [
          "id",
          "name",
          "profileUrl",
          "email",
          "password",
          "role",
          "isAdmin",
        ],
      });

      if (user) {
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
          role: user.role,
          isAdmin: user.isAdmin,
          type: "user",
        };
        const access_token = jwt.sign(userObj, process.env.JWT_SECRET, {
          expiresIn: "7h",
        });
        const refresh_token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
        const newRefreshToken = new RefreshToken();
        newRefreshToken.token = refresh_token;
        newRefreshToken.user = user;
        newRefreshToken.expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ); // 7 days
        await refreshTokenRepository.save(newRefreshToken);
        // Set refresh token in HTTP-only cookie (if needed)
        return res.json({
          status: "success",
          access_token,
          refresh_token,
          user: userObj,
        });
      }


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