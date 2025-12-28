-- Email Templates for Ticket System
-- Run this SQL to create email templates for ticket notifications

-- 1. Ticket Created Template
INSERT INTO EmailTemplate (name, subject, body, variables, category, isActive, createdAt, updatedAt)
VALUES (
  'Ticket Created Notification',
  'Ticket Created: {ticketNumber} - {title}',
  '<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #574193;">Ticket Created Successfully</h2>

    <p>Dear <strong>{reportedByName}</strong>,</p>

    <p>Your ticket has been created successfully. Our team will review it and respond as soon as possible.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Ticket Number:</td>
          <td style="padding: 8px 0;">{ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
          <td style="padding: 8px 0;">{title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
          <td style="padding: 8px 0;"><span style="background: {priorityColor}; padding: 4px 12px; border-radius: 12px; color: white;">{priority}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Type:</td>
          <td style="padding: 8px 0;">{type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Category:</td>
          <td style="padding: 8px 0;">{category}</td>
        </tr>
      </table>
    </div>

    <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Description:</strong></p>
      <p style="margin: 5px 0 0;">{description}</p>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{ticketUrl}" style="display: inline-block; background: #574193; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Ticket Details
      </a>
    </p>
  </div>',
  '["ticketNumber", "title", "priority", "priorityColor", "type", "category", "description", "reportedByName", "ticketUrl"]',
  'ticket_created',
  1,
  datetime('now'),
  datetime('now')
);

-- 2. Ticket Assigned Template
INSERT INTO EmailTemplate (name, subject, body, variables, category, isActive, createdAt, updatedAt)
VALUES (
  'Ticket Assigned Notification',
  'New Assignment: {ticketNumber} - {title}',
  '<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #574193;">Ticket Assigned To You</h2>

    <p>Dear <strong>{assignedToName}</strong>,</p>

    <p>A ticket has been assigned to you. Please review and take necessary action.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">{title}</h3>
      <p style="color: #666;">{description}</p>

      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Ticket:</td>
          <td style="padding: 8px 0;">{ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
          <td style="padding: 8px 0;"><span style="background: {priorityColor}; padding: 4px 12px; border-radius: 12px; color: white;">{priority}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Type:</td>
          <td style="padding: 8px 0;">{type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Reported By:</td>
          <td style="padding: 8px 0;">{reportedByName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">SLA Deadline:</td>
          <td style="padding: 8px 0; color: #d32f2f; font-weight: bold;">{slaDeadline}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{ticketUrl}" style="display: inline-block; background: #574193; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View & Respond
      </a>
    </p>
  </div>',
  '["ticketNumber", "title", "priority", "priorityColor", "type", "description", "assignedToName", "reportedByName", "slaDeadline", "ticketUrl"]',
  'ticket_assigned',
  1,
  datetime('now'),
  datetime('now')
);

-- 3. Ticket Status Changed Template
INSERT INTO EmailTemplate (name, subject, body, variables, category, isActive, createdAt, updatedAt)
VALUES (
  'Ticket Status Changed Notification',
  'Ticket Update: {ticketNumber} - Status Changed',
  '<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #574193;">Ticket Status Updated</h2>

    <p>Dear <strong>{reportedByName}</strong>,</p>

    <p>The status of your ticket has been updated.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">{title}</h3>
      <p style="color: #888; font-size: 13px;">Ticket #{ticketNumber}</p>

      <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 6px; text-align: center;">
        <span style="padding: 8px 16px; background: #f5f5f5; border-radius: 6px; font-weight: bold;">{oldStatus}</span>
        <span style="font-size: 20px; margin: 0 15px;">→</span>
        <span style="padding: 8px 16px; background: #4caf50; color: white; border-radius: 6px; font-weight: bold;">{newStatus}</span>
      </div>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{ticketUrl}" style="display: inline-block; background: #574193; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Ticket
      </a>
    </p>
  </div>',
  '["ticketNumber", "title", "oldStatus", "newStatus", "reportedByName", "ticketUrl"]',
  'ticket_status_changed',
  1,
  datetime('now'),
  datetime('now')
);

-- 4. Ticket Resolved Template
INSERT INTO EmailTemplate (name, subject, body, variables, category, isActive, createdAt, updatedAt)
VALUES (
  'Ticket Resolved Notification',
  'Ticket Resolved: {ticketNumber} - {title}',
  '<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #16a34a;">✓ Ticket Resolved</h2>

    <p>Dear <strong>{reportedByName}</strong>,</p>

    <p>Great news! Your ticket has been resolved.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">{title}</h3>
      <p style="color: #888; font-size: 13px;">Ticket #{ticketNumber}</p>

      <div style="margin: 15px 0; padding: 15px; background: #f1f8f5; border-radius: 6px;">
        <p style="margin: 0; font-weight: bold;">Resolution:</p>
        <p style="margin: 5px 0 0;">{resolution}</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        <strong>Resolved By:</strong> {resolvedByName}
      </p>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404;">
        <strong>Need help?</strong> If you''re still experiencing issues, please reopen this ticket or create a new one.
      </p>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{ticketUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Details
      </a>
    </p>
  </div>',
  '["ticketNumber", "title", "resolution", "resolvedByName", "reportedByName", "ticketUrl"]',
  'ticket_resolved',
  1,
  datetime('now'),
  datetime('now')
);

-- 5. SLA Breach Alert Template
INSERT INTO EmailTemplate (name, subject, body, variables, category, isActive, createdAt, updatedAt)
VALUES (
  'SLA Breach Alert',
  '⚠️ SLA BREACH ALERT: {ticketNumber}',
  '<div style="font-family: Arial, sans-serif;">
    <h2 style="color: #dc2626;">⚠️ SLA BREACH ALERT</h2>

    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0; color: #856404; font-size: 16px; font-weight: bold;">⏰ SLA DEADLINE BREACHED</p>
      <p style="margin: 10px 0 0; color: #856404;">The following ticket has exceeded its SLA deadline and requires immediate attention.</p>
    </div>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">{title}</h3>

      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold; width: 140px;">Ticket Number:</td>
          <td style="padding: 8px 0;">{ticketNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Priority:</td>
          <td style="padding: 8px 0;"><span style="background: {priorityColor}; padding: 4px 12px; border-radius: 12px; color: white;">{priority}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
          <td style="padding: 8px 0;">{status}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Assigned To:</td>
          <td style="padding: 8px 0;">{assignedToName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Time Overdue:</td>
          <td style="padding: 8px 0; color: #d32f2f; font-weight: bold;">{timeOverdue}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{ticketUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        TAKE ACTION NOW
      </a>
    </p>
  </div>',
  '["ticketNumber", "title", "priority", "priorityColor", "status", "assignedToName", "timeOverdue", "ticketUrl"]',
  'ticket_sla_breach',
  1,
  datetime('now'),
  datetime('now')
);
