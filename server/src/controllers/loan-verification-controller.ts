import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { LoanVerification } from "../entities/LoanVerification";
import { Loan } from "../entities/Loan";
import { Group } from "../entities/Group";
import { Member } from "../entities/Member";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../errors/http.errors";

export class LoanVerificationController {
    private repository: Repository<LoanVerification> = AppDataSource.getRepository(LoanVerification);
    private loanRepository: Repository<Loan> = AppDataSource.getRepository(Loan);
    private groupRepository: Repository<Group> = AppDataSource.getRepository(Group);
    private memberRepository: Repository<Member> = AppDataSource.getRepository(Member);
    private userRepository: Repository<User> = AppDataSource.getRepository(User);

    // Verify a loan (approve/reject) by a group leader
    verifyLoan = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { loanId } = req.params;
            const { status, notes } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return next(new UnauthorizedError("Authentication required"));
            }

            // Find the loan with group and leader information
            const loan = await this.loanRepository.findOne({
                where: { id: Number(loanId) },
                relations: ["group", "group.president", "group.accountant", "group.secretary", "member"],
            });

            if (!loan) {
                return next(new NotFoundError("Loan not found"));
            }

            // Find the current user
            const user = await this.userRepository.findOne({
                where: { id: userId },
            });

            if (!user) {
                return next(new BadRequestError("User not found"));
            }

            // For now, we'll use the user's name as the member identifier
            // In a real implementation, you might want to link users to members differently
            const memberName = user.name || user.first_name + ' ' + user.last_name;

            // For now, allow any authenticated user to verify loans
            // In a real implementation, you would check if the user is a leader of the group
            // This is a simplified version for demonstration purposes

            // For demonstration, we'll use the first available leader
            let leaderMember = loan.group.president || loan.group.accountant || loan.group.secretary;

            if (!leaderMember) {
                return next(new BadRequestError("No group leaders found"));
            }

            // Check if this leader has already verified this loan
            const existingVerification = await this.repository.findOne({
                where: {
                    loan: { id: loan.id },
                    member: { id: leaderMember.id },
                },
            });

            if (existingVerification) {
                return next(new BadRequestError("You have already verified this loan"));
            }

            // Create verification record
            const verification = this.repository.create({
                loan,
                member: leaderMember, // Use the actual leader member who is verifying
                status,
                notes,
            });

            await this.repository.save(verification);

            // Check if all required leaders have verified
            await this.checkAndUpdateLoanStatus(loan.id);

            res.status(200).json({
                status: "success",
                message: "Loan verification submitted successfully",
                data: verification,
            });
        }
    );

    // Get verification status for a loan
    getLoanVerifications = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { loanId } = req.params;

            const loan = await this.loanRepository.findOne({
                where: { id: Number(loanId) },
                relations: [
                    "member",
                    "group",
                    "group.president",
                    "group.accountant",
                    "group.secretary",
                    "verifications",
                ],
            });

            if (!loan) {
                return next(new NotFoundError("Loan not found"));
            }

            // Get all verifications for this loan
            const verifications = await this.repository.find({
                where: { loan: { id: loan.id } },
                relations: ["member"],
            });

            // Create verification status for each leader
            const verificationStatus = {
                president: {
                    member: loan.group.president,
                    verification: verifications.find(v => v.member.id === loan.group.president?.id) || null,
                    required: true,
                },
                accountant: {
                    member: loan.group.accountant,
                    verification: verifications.find(v => v.member.id === loan.group.accountant?.id) || null,
                    required: true,
                },
                secretary: {
                    member: loan.group.secretary,
                    verification: verifications.find(v => v.member.id === loan.group.secretary?.id) || null,
                    required: true,
                },
            };

            res.status(200).json({
                status: "success",
                data: {
                    loan,
                    verificationStatus,
                    verifications,
                },
            });
        }
    );

    // Get pending loans for a group leader
    getPendingLoansForLeader = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.user?.id;

            if (!userId) {
                return next(new UnauthorizedError("Authentication required"));
            }

            // For now, return all pending loans
            // In a real implementation, you would filter by groups where the user is a leader
            const pendingLoans = await this.loanRepository.find({
                where: {
                    status: "pending",
                },
                relations: [
                    "group",
                    "member",
                    "verifications",
                ],
            });

            res.status(200).json({
                status: "success",
                data: pendingLoans,
            });
        }
    );

    // Private method to check and update loan status based on verifications
    private async checkAndUpdateLoanStatus(loanId: number) {
        const loan = await this.loanRepository.findOne({
            where: { id: loanId },
            relations: [
                "group",
                "group.president",
                "group.accountant",
                "group.secretary",
                "verifications",
            ],
        });

        if (!loan) return;

        const verifications = loan.verifications;
        const requiredLeaders = [
            loan.group.president,
            loan.group.accountant,
            loan.group.secretary,
        ].filter(Boolean);

        // Check if any verification was rejected
        const hasRejection = verifications.some(v => v.status === "Rejected");
        if (hasRejection) {
            loan.status = "rejected";
            await this.loanRepository.save(loan);
            return;
        }

        // Check if all required leaders have approved
        // All three leaders (President, Accountant, Secretary) must approve
        const allLeadersApproved = requiredLeaders.every(leader => {
            return verifications.some(v =>
                v.member.id === leader.id && v.status === "Approved"
            );
        });

        if (allLeadersApproved && requiredLeaders.length > 0) {
            loan.status = "approved";
            await this.loanRepository.save(loan);
        }
    }
} 