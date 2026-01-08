import React from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './TermsAndConditions.css';

const PrivacyPolicy = () => {

  return (
    <div className="privacy-page">
      <Container className="privacy-container py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="privacy-header text-center mb-4">
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-subtitle">Last updated: January 1, 2026</p>
          </div>

          <div className="privacy-content">
            <section className="privacy-section">
              <h2>1. Introduction</h2>
              <p>
                Schedule Hub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our automated timetable scheduling service.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us when using Schedule Hub:
              </p>
              
              <h3 style={{ fontSize: '1.125rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--theme-color)', fontWeight: '600' }}>
                Institute Information
              </h3>
              <ul>
                <li>Institute name, ID, and type (school, college, university)</li>
                <li>Institute logo and branding materials</li>
                <li>Institute address and contact number</li>
                <li>Working days and operational hours</li>
              </ul>

              <h3 style={{ fontSize: '1.125rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--theme-color)', fontWeight: '600' }}>
                User Account Information
              </h3>
              <ul>
                <li>Full name and email address</li>
                <li>Phone number and country</li>
                <li>National ID/CNIC/SSN (as applicable)</li>
                <li>Password (encrypted and hashed)</li>
                <li>User designation (Admin, Teacher, Student)</li>
              </ul>

              <h3 style={{ fontSize: '1.125rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--theme-color)', fontWeight: '600' }}>
                Academic Data
              </h3>
              <ul>
                <li>Class information (names, sections, student counts)</li>
                <li>Course details (names, codes, credit hours)</li>
                <li>Room information (names, types, capacities)</li>
                <li>Time slots and scheduling preferences</li>
                <li>Teacher assignments and availability</li>
                <li>Generated timetables and schedules</li>
              </ul>

              <h3 style={{ fontSize: '1.125rem', marginTop: '1rem', marginBottom: '0.75rem', color: 'var(--theme-color)', fontWeight: '600' }}>
                Usage Information
              </h3>
              <ul>
                <li>Login timestamps and activity logs</li>
                <li>Feature usage and interactions</li>
                <li>Feedback and comments submitted</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. How We Use Your Information</h2>
              <p>
                We use the information we collect for the following purposes:
              </p>
              <ul>
                <li><strong>Service Provision:</strong> To provide, maintain, and improve Schedule Hub's timetable generation and management features</li>
                <li><strong>Account Management:</strong> To create and manage your user account and authenticate your identity</li>
                <li><strong>Communication:</strong> To send you service updates, security alerts, and support messages</li>
                <li><strong>Timetable Generation:</strong> To process your academic data and generate conflict-free timetables</li>
                <li><strong>Analytics:</strong> To understand how users interact with our service and improve functionality</li>
                <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>4. Data Storage and Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul>
                <li><strong>Encryption:</strong> All data is encrypted in transit using SSL/TLS and at rest using AES-256 encryption</li>
                <li><strong>Access Control:</strong> Access to user data is restricted to authorized personnel only</li>
                <li><strong>Secure Storage:</strong> Data is stored in secure, professionally managed data centers</li>
                <li><strong>Regular Backups:</strong> Automated backups are performed daily to prevent data loss</li>
                <li><strong>Password Protection:</strong> Passwords are hashed using bcrypt with salt</li>
                <li><strong>Monitoring:</strong> Continuous monitoring for security threats and vulnerabilities</li>
              </ul>
              <p>
                Despite our security measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Data Sharing and Disclosure</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our service (e.g., payment processors, cloud hosting)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulations</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Security:</strong> To protect the rights, property, or safety of Schedule Hub, our users, or others</li>
              </ul>
              <p>
                Within your institute, data visibility is role-based:
              </p>
              <ul>
                <li>Admins can view all institute data</li>
                <li>Teachers can view their assigned classes and schedules</li>
                <li>Students can view their own class schedules</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>6. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide the service and fulfill the purposes outlined in this privacy policy:
              </p>
              <ul>
                <li><strong>Active Accounts:</strong> Data is retained while your account is active and subscription is valid</li>
                <li><strong>Inactive Accounts:</strong> After subscription expiration, data is retained for 30 days to allow for reactivation</li>
                <li><strong>Deleted Accounts:</strong> After account deletion, personal data is removed within 30 days, except where retention is required by law</li>
                <li><strong>Backup Data:</strong> Deleted data may persist in backups for up to 90 days before permanent deletion</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>7. Your Rights and Choices</h2>
              <p>
                You have the following rights regarding your personal information:
              </p>
              <ul>
                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Export:</strong> Download your data in a portable format at any time</li>
                <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for processing where consent was the basis</li>
              </ul>
              <p>
                To exercise these rights, contact us at support@smartscheduler.com. We will respond to your request within 30 days.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to improve your experience:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the service</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Note that disabling cookies may affect service functionality.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Third-Party Services</h2>
              <p>
                Schedule Hub integrates with certain third-party services:
              </p>
              <ul>
                <li><strong>Google OAuth:</strong> For optional social login (subject to Google's privacy policy)</li>
                <li><strong>Payment Processors:</strong> For subscription payments (we do not store credit card information)</li>
                <li><strong>Cloud Hosting:</strong> For secure data storage and service delivery</li>
              </ul>
              <p>
                These third parties have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section className="privacy-section">
              <h2>10. Children's Privacy</h2>
              <p>
                Schedule Hub is designed for educational institutes and is not intended for use by individuals under 13 years of age. While students may access timetables through the service, account creation and data input must be performed by authorized institute personnel who are 18 years or older.
              </p>
              <p>
                If we discover that we have collected personal information from a child under 13 without proper authorization, we will delete that information immediately.
              </p>
            </section>

            <section className="privacy-section">
              <h2>11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from your jurisdiction.
              </p>
              <p>
                By using Schedule Hub, you consent to the transfer of your information to our facilities and service providers globally. We ensure appropriate safeguards are in place for international transfers.
              </p>
            </section>

            <section className="privacy-section">
              <h2>12. Updates to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
              </p>
              <ul>
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending email notification for significant changes</li>
                <li>Requiring re-acceptance for material changes</li>
              </ul>
              <p>
                Continued use of the service after changes become effective constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="privacy-section">
              <h2>13. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <p>
                <strong>Email:</strong> support@smart-scheduler.pages.dev<br />
                <strong>Privacy Officer:</strong> privacy@smart-scheduler.pages.dev<br />
                <strong>Website:</strong> <a href="https://www.smart-scheduler.pages.dev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-color)' }}>www.smart-scheduler.pages.dev</a>
              </p>
              <p>
                We will respond to all legitimate requests within 30 days.
              </p>
            </section>

            <section className="privacy-section">
              <h2>14. Your Consent</h2>
              <p>
                By using Schedule Hub, you consent to our Privacy Policy and agree to its terms. If you do not agree with this policy, please do not use our service.
              </p>
            </section>
          </div>

          <div className="privacy-footer text-center mt-5">
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Visit our website for more information
            </p>
            <a 
              href="https://www.smart-scheduler.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                color: 'var(--theme-color)',
                fontSize: '1.125rem',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              www.smart-scheduler.pages.dev
            </a>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default PrivacyPolicy;
