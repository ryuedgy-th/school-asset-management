/**
 * Ticket Email Notifications
 * 
 * Email templates and helper functions for ticket-related notifications
 */

import { formatTimeRemaining } from './sla';

interface Ticket {
  id: number;
  ticketNumber: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  slaDeadline?: Date | null;
  reportedBy?: { name: string; email: string };
  assignedTo?: { name: string; email: string } | null;
  itAsset?: { assetCode: string; name: string } | null;
  fmAsset?: { assetCode: string; name: string } | null;
  resolution?: string | null;
  resolutionNotes?: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdBy: { name: string };
  createdAt: Date;
}

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Ticket Created Email
 */
export function ticketCreatedEmail(ticket: Ticket): {
  to: string;
  subject: string;
  html: string;
} {
  const assetInfo = ticket.itAsset
    ? `IT Asset: ${ticket.itAsset.assetCode} - ${ticket.itAsset.name}`
    : ticket.fmAsset
      ? `FM Asset: ${ticket.fmAsset.assetCode} - ${ticket.fmAsset.name}`
      : 'No asset linked';

  return {
    to: ticket.reportedBy?.email || '',
    subject: `Ticket Created: ${ticket.ticketNumber} - ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Ticket Created</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">
            Dear ${ticket.reportedBy?.name},
          </p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Your ticket has been  created successfully. Our team will review it and respond as soon as possible.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Ticket Number:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Type:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
                <td style="padding: 8px 0; color: #333;">
                  <span style="background: ${getPriorityColor(ticket.priority)}; padding: 4px 12px; border-radius: 12px; color: white; font-size: 12px;">
                    ${ticket.priority.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Asset:</td>
                <td style="padding: 8px 0; color: #333;">${assetInfo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">SLA:</td>
                <td style="padding: 8px 0; color: #333;">${formatTimeRemaining(ticket.slaDeadline || null)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #333; font-weight: bold;">Title:</p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">${ticket.title}</p>
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View Ticket
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Ticket Assigned Email
 */
export function ticketAssignedEmail(ticket: Ticket): {
  to: string;
  subject: string;
  html: string;
} {
  if (!ticket.assignedTo) {
    throw new Error('Ticket has no assignee');
  }

  const assetInfo = ticket.itAsset
    ? `${ticket.itAsset.assetCode} - ${ticket.itAsset.name}`
    : ticket.fmAsset
      ? `${ticket.fmAsset.assetCode} - ${ticket.fmAsset.name}`
      : 'No asset';

  return {
    to: ticket.assignedTo.email,
    subject: `New Assignment: ${ticket.ticketNumber} - ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">👤 Ticket Assigned to You</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">
            Dear ${ticket.assignedTo.name},
          </p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A ticket has been assigned to you. Please review and take necessary action.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
            <h3 style="margin-top: 0; color: #333;">${ticket.title}</h3>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">${ticket.description.substring(0, 150)}${ticket.description.length > 150 ? '...' : ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Ticket:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${getPriorityColor(ticket.priority)}; padding: 4px 12px; border-radius: 12px; color: white; font-size: 12px;">
                    ${ticket.priority.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Asset:</td>
                <td style="padding: 8px 0; color: #333;">${assetInfo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Reported By:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.reportedBy?.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Response Due:</td>
                <td style="padding: 8px 0; color: #d32f2f; font-weight: bold;">${formatTimeRemaining(ticket.slaDeadline || null)}</td>
              </tr>
            </table>
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}" 
             style="display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View & Respond
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Ticket Status Changed Email
 */
export function ticketStatusChangedEmail(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
): {
  to: string;
  subject: string;
  html: string;
} {
  return {
    to: ticket.reportedBy?.email || '',
    subject: `Ticket Update: ${ticket.ticketNumber} - ${oldStatus} → ${newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🔄 Ticket Status Updated</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">
            Dear ${ticket.reportedBy?.name},
          </p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            The status of your ticket has been updated.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${ticket.title}</h3>
            <p style="color: #888; font-size: 13px;">Ticket #${ticket.ticketNumber}</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 6px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <span style="padding: 8px 16px; background: #f5f5f5; border-radius: 6px; font-weight: bold;">${oldStatus.toUpperCase()}</span>
                <span style="font-size: 20px;">→</span>
                <span style="padding: 8px 16px; background: #4caf50; color: white; border-radius: 6px; font-weight: bold;">${newStatus.toUpperCase()}</span>
              </div>
            </div>
            
            ${ticket.assignedTo ? `
              <p style="color: #666; font-size: 14px;">
                <strong>Handled By:</strong> ${ticket.assignedTo.name}
              </p>
            ` : ''}
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}" 
             style="display: inline-block; background: #00f2fe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View Ticket
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Comment Added Email
 */
export function ticketCommentAddedEmail(ticket: Ticket, comment: Comment): {
  to: string;
  subject: string;
  html: string;
} {
  // Send to reporter if comment is from assignee, and vice versa
  const recipient = ticket.reportedBy?.email || '';

  return {
    to: recipient,
    subject: `New Comment on Ticket: ${ticket.ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">💬 New Comment Added</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            A new comment has been added to ticket <strong>${ticket.ticketNumber}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fa709a;">
            <p style="color: #888; font-size: 12px; margin: 0 0 5px 0;">
              ${comment.createdBy.name} • ${new Date(comment.createdAt).toLocaleString()}
            </p>
            <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 10px 0;">
              ${comment.content}
            </p>
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}#comments" 
             style="display: inline-block; background: #fa709a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View & Reply
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Ticket Resolved Email
 */
export function ticketResolvedEmail(ticket: Ticket): {
  to: string;
  subject: string;
  html: string;
} {
  return {
    to: ticket.reportedBy?.email || '',
    subject: `Ticket Resolved: ${ticket.ticketNumber} - ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Ticket Resolved</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">
            Dear ${ticket.reportedBy?.name},
          </p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Great news! Your ticket has been resolved.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38ef7d;">
            <h3 style="margin-top: 0; color: #333;">${ticket.title}</h3>
            <p style="color: #888; font-size: 13px;">Ticket #${ticket.ticketNumber}</p>
            
            ${ticket.resolution ? `
              <div style="margin: 15px 0; padding: 15px; background: #f1f8f5; border-radius: 6px;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                  <strong>Resolution:</strong><br/>
                  ${ticket.resolution}
                </p>
              </div>
            ` : ''}
            
            ${ticket.assignedTo ? `
              <p style="color: #666; font-size: 14px;">
                <strong>Resolved By:</strong> ${ticket.assignedTo.name}
              </p>
            ` : ''}
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Need help?</strong> If you're still experiencing issues, please reopen this ticket or create a new one.
            </p>
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}" 
             style="display: inline-block; background: #38ef7d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View Details
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * SLA Breach Alert Email
 */
export function slaBreachAlertEmail(ticket: Ticket): {
  to: string[];
  subject: string;
  html: string;
} {
  const recipients = [];

  if (ticket.assignedTo?.email) {
    recipients.push(ticket.assignedTo.email);
  }

  // TODO: Add manager/supervisor emails from notification recipients

  return {
    to: recipients,
    subject: `⚠️ SLA BREACH ALERT: ${ticket.ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ SLA BREACH ALERT</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; border-left: 4px solid #ff6b6b;">
            <p style="margin: 0; color: #856404; font-size: 16px; font-weight: bold;">
              ⏰ SLA DEADLINE BREACHED
            </p>
            <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">
              The following ticket has exceeded its SLA deadline and requires immediate attention.
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${ticket.title}</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 140px;">Ticket Number:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
                <td style="padding: 8px 0;">
                  <span style="background: ${getPriorityColor(ticket.priority)}; padding: 4px 12px; border-radius: 12px; color: white; font-size: 12px;">
                    ${ticket.priority.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.status}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Assigned To:</td>
                <td style="padding: 8px 0; color: #333;">${ticket.assignedTo?.name || 'Unassigned'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Time Overdue:</td>
                <td style="padding: 8px 0; color: #d32f2f; font-weight: bold;">${formatTimeRemaining(ticket.slaDeadline || null)}</td>
              </tr>
            </table>
          </div>
          
          <a href="${BASE_URL}/tickets/${ticket.id}" 
             style="display: inline-block; background: #f45c43; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            Take Action Now
          </a>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            This is an automated SLA breach alert. Immediate action is required.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Helper function to get priority color
 */
function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return '#d32f2f';
    case 'high':
      return '#f57c00';
    case 'medium':
      return '#ffa726';
    case 'low':
      return '#66bb6a';
    default:
      return '#9e9e9e';
  }
}
