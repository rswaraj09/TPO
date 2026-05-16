const wrap = (title: string, body: string): string => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Vishwaniketan TPO</h1>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 32px 24px; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0; color: #111827;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #6b7280; font-size: 13px; margin: 0;">Regards,<br/><strong>Training & Placement Cell</strong><br/>Vishwaniketan iMEET</p>
  </div>
</div>`;

export const welcomeEmail = (fullName: string): { subject: string; html: string } => ({
  subject: "Welcome to Vishwaniketan TPO Portal",
  html: wrap(
    `Welcome, ${fullName}!`,
    `<p>Your account has been created successfully.</p>
     <p>Your registration is currently under review. You will be notified once an administrator approves your account.</p>
     <p>For fast approval, reach out to your T&amp;P faculty coordinator.</p>`
  ),
});

export const accountApprovedEmail = (fullName: string): { subject: string; html: string } => ({
  subject: "Your TPO Account has been Approved",
  html: wrap(
    `You're in, ${fullName}!`,
    `<p>Your TPO account has been verified and approved.</p>
     <p>You can now log in and start building your placement profile.</p>
     <p style="margin: 24px 0;">
       <a href="${process.env.FRONTEND_URL}/login" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Login to Portal</a>
     </p>`
  ),
});

export const accountRejectedEmail = (fullName: string, reason?: string): { subject: string; html: string } => ({
  subject: "Your TPO Account Registration was not Approved",
  html: wrap(
    `Hello ${fullName}`,
    `<p>Unfortunately, your TPO account registration was not approved.</p>
     ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
     <p>Please reach out to your T&amp;P faculty coordinator for assistance.</p>`
  ),
});

export const passwordResetEmail = (fullName: string, resetLink: string): { subject: string; html: string } => ({
  subject: "Reset your TPO Portal password",
  html: wrap(
    `Hi ${fullName}`,
    `<p>We received a request to reset your password. Click the button below to set a new password.</p>
     <p style="margin: 24px 0;">
       <a href="${resetLink}" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
     </p>
     <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`
  ),
});

export const verificationApprovedEmail = (
  fullName: string,
  entityType: string
): { subject: string; html: string } => ({
  subject: `Your ${entityType} update was approved`,
  html: wrap(
    `Hi ${fullName}`,
    `<p>Your recent update to <strong>${entityType}</strong> has been verified and approved by the faculty.</p>
     <p>Your profile has been updated accordingly.</p>`
  ),
});

export const verificationRejectedEmail = (
  fullName: string,
  entityType: string,
  remarks?: string
): { subject: string; html: string } => ({
  subject: `Your ${entityType} update was rejected`,
  html: wrap(
    `Hi ${fullName}`,
    `<p>Your recent update to <strong>${entityType}</strong> was rejected by the faculty.</p>
     ${remarks ? `<p><strong>Faculty remarks:</strong> ${remarks}</p>` : ""}
     <p>Please review the feedback and resubmit with the necessary corrections.</p>`
  ),
});

export const newJobPostedEmail = (
  fullName: string,
  companyName: string,
  jobTitle: string,
  jobLink: string
): { subject: string; html: string } => ({
  subject: `New Job Opportunity: ${companyName} - ${jobTitle}`,
  html: wrap(
    `Hi ${fullName}`,
    `<p>A new placement drive matching your profile has been posted.</p>
     <p><strong>${companyName}</strong> is hiring for <strong>${jobTitle}</strong>.</p>
     <p style="margin: 24px 0;">
       <a href="${jobLink}" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">View Details &amp; Apply</a>
     </p>`
  ),
});

export const facultyWelcomeEmail = (
  fullName: string,
  emailId: string,
  tempPassword: string,
  isHOD: boolean
): { subject: string; html: string } => ({
  subject: "Your Vishwaniketan TPO faculty account is ready",
  html: wrap(
    `Welcome, ${fullName}`,
    `<p>An administrator has created a ${isHOD ? "<strong>HOD</strong>" : "faculty"} account for you on the TPO Portal.</p>
     <p><strong>Login credentials:</strong></p>
     <p style="background: #f3f4f6; padding: 12px 16px; border-radius: 6px; font-family: monospace;">
       Email: ${emailId}<br/>
       Temporary password: ${tempPassword}
     </p>
     <p>Please log in and change your password from the profile settings immediately.</p>
     <p style="margin: 24px 0;">
       <a href="${process.env.FRONTEND_URL}/login" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Login to Portal</a>
     </p>`
  ),
});

export const applicationStatusEmail = (
  fullName: string,
  companyName: string,
  jobTitle: string,
  status: string
): { subject: string; html: string } => ({
  subject: `Application update: ${companyName} - ${jobTitle}`,
  html: wrap(
    `Hi ${fullName}`,
    `<p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
     <p>New status: <strong style="color: #1e40af;">${status.replace(/_/g, " ")}</strong></p>
     <p>Check your dashboard for next steps.</p>
     <p style="margin: 24px 0;">
       <a href="${process.env.FRONTEND_URL}/student/jobs" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">View Dashboard</a>
     </p>`
  ),
});

export const alumniInviteEmail = (
  fullName: string,
  inviteLink: string
): { subject: string; html: string } => ({
  subject: "You're now a Vishwaniketan Alumni - Activate your profile",
  html: wrap(
    `Congratulations, ${fullName}!`,
    `<p>You have been marked as a graduate. Your account has been converted to an alumni account.</p>
     <p>Log in and share your career journey, offer mentorship, and post job referrals for current students.</p>
     <p style="margin: 24px 0;">
       <a href="${inviteLink}" style="background: #1e40af; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Activate Alumni Profile</a>
     </p>`
  ),
});
