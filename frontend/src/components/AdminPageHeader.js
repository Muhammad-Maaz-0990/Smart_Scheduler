import React from 'react';
import { motion } from 'framer-motion';

const AdminPageHeader = ({ icon: Icon, title, subtitle, actions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3"
      style={{ 
        padding: '1rem',
        minHeight: '82px',
        borderBottom: '1px solid rgba(17, 24, 39, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          background: 'var(--theme-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(105, 65, 219, 0.3)',
          flexShrink: 0
        }}>
          {Icon && <Icon style={{ fontSize: '1.5rem', color: 'white' }} />}
        </div>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: 'var(--theme-color)',
            lineHeight: '1.2',
            margin: 0
          }}>
            {title}
          </h2>
          <p style={{
            fontSize: 'clamp(0.85rem, 1.8vw, 0.95rem)',
            color: 'var(--theme-color)',
            margin: 0,
            fontWeight: '600'
          }}>
            {subtitle}
          </p>
        </div>
      </div>
      
      {actions && (
        <div className="d-flex gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

export default AdminPageHeader;
