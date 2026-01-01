import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <Container className="terms-container py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="terms-header text-center mb-4">
            <h1 className="terms-title">Terms and Conditions</h1>
            <p className="terms-subtitle">Last updated: January 1, 2026</p>
          </div>

          <div className="terms-content">
            <section className="terms-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Smart Scheduler ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Use License</h2>
              <p>
                Permission is granted to temporarily use Smart Scheduler for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul>
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained in Smart Scheduler</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. Service Description</h2>
              <p>
                Smart Scheduler is an automated timetable scheduling system designed to help educational institutes create conflict-free timetables efficiently. The Service includes:
              </p>
              <ul>
                <li>Automated timetable generation for schools, colleges, and universities</li>
                <li>Management of classes, courses, rooms, and time slots</li>
                <li>User management for administrators, teachers, and students</li>
                <li>Timetable viewing and feedback collection features</li>
                <li>Institute information management</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>4. User Accounts</h2>
              <p>
                When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p>
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Free Trial</h2>
              <p>
                Smart Scheduler offers a 7-day free trial period for new institute registrations. During the trial period, you will have access to all features of the Service. After the trial period expires, continued use of the Service requires a valid subscription.
              </p>
              <ul>
                <li>The free trial is available only once per institute</li>
                <li>No credit card is required for the trial period</li>
                <li>You may cancel at any time during the trial with no charges</li>
                <li>Features available during trial may be subject to usage limits</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>6. Subscription and Payment</h2>
              <p>
                After the free trial period, continued access to Smart Scheduler requires a paid subscription. Subscription fees are billed in advance on a monthly or annual basis depending on your chosen plan.
              </p>
              <ul>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>Refunds are not provided for partial subscription periods</li>
                <li>We reserve the right to modify subscription fees with 30 days notice</li>
                <li>Payment information is processed securely through third-party payment processors</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>7. Data and Privacy</h2>
              <p>
                Your use of Smart Scheduler is also governed by our Privacy Policy. We collect and process data necessary to provide the Service, including institute information, user details, timetable data, and feedback.
              </p>
              <ul>
                <li>We do not sell or share your data with third parties for marketing purposes</li>
                <li>Institute data remains the property of the institute</li>
                <li>You may export your data at any time</li>
                <li>Data is stored securely with industry-standard encryption</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>8. Institute Responsibilities</h2>
              <p>
                As an institute using Smart Scheduler, you agree to:
              </p>
              <ul>
                <li>Provide accurate information about your institute, classes, courses, and schedules</li>
                <li>Ensure that uploaded content (logos, documents) does not infringe on any third-party rights</li>
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Maintain the security of your admin accounts and manage user access appropriately</li>
                <li>Review and verify generated timetables before implementation</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>9. Service Availability</h2>
              <p>
                We strive to maintain 99.9% uptime, but we do not guarantee that the Service will be available at all times. The Service may be temporarily unavailable due to:
              </p>
              <ul>
                <li>Scheduled maintenance (with advance notice when possible)</li>
                <li>Emergency repairs or updates</li>
                <li>Internet service provider issues</li>
                <li>Force majeure events beyond our control</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>10. Limitation of Liability</h2>
              <p>
                Smart Scheduler and its suppliers will not be held accountable for any damages that arise from the use or inability to use the Service, including but not limited to:
              </p>
              <ul>
                <li>Errors or inaccuracies in generated timetables</li>
                <li>Data loss or corruption</li>
                <li>Service interruptions or downtime</li>
                <li>Unauthorized access to your data</li>
                <li>Any other issues arising from use of the Service</li>
              </ul>
              <p>
                You are responsible for reviewing all generated timetables and ensuring they meet your requirements before implementation.
              </p>
            </section>

            <section className="terms-section">
              <h2>11. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including but not limited to breach of these Terms. Upon termination:
              </p>
              <ul>
                <li>Your right to use the Service will immediately cease</li>
                <li>You will lose access to your account and data after 30 days</li>
                <li>We will provide a data export option during the 30-day grace period</li>
                <li>Outstanding subscription fees remain due and payable</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>12. Intellectual Property</h2>
              <p>
                The Service and its original content (excluding user-provided content), features, and functionality are and will remain the exclusive property of Smart Scheduler. The Service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section className="terms-section">
              <h2>13. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Continued use of the Service after changes become effective constitutes acceptance of the revised terms.
              </p>
            </section>

            <section className="terms-section">
              <h2>14. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="terms-section">
              <h2>15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> support@smart-scheduler.pages.dev<br />
                <strong>Website:</strong> <a href="https://www.smart-scheduler.pages.dev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-color)' }}>www.smart-scheduler.pages.dev</a>
              </p>
            </section>
          </div>

          <div className="terms-footer text-center mt-5">
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

export default TermsAndConditions;
