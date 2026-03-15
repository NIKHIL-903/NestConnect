// Reusable dropdown for selecting domains
import React from 'react';

const DomainSelector = ({ selectedDomains, onChange, multiple = true }) => {
  const domains = [
    'Technology', 'Finance', 'Sports', 'Music', 
    'Art', 'Fitness', 'Business'
  ];

  const handleChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    if (multiple) {
      if (!selectedDomains.includes(value)) {
        onChange([...selectedDomains, value]);
      }
    } else {
      onChange(value);
    }
  };

  const removeDomain = (domainToRemove) => {
    onChange(selectedDomains.filter(d => d !== domainToRemove));
  };

  return (
    <div className="domain-selector mb-1">
      <select 
        className="input-field" 
        onChange={handleChange}
        value={(!multiple && selectedDomains.length > 0) ? selectedDomains[0] : ""}
      >
        <option value="" disabled>Select a domain...</option>
        {domains.map(domain => (
          <option key={domain} value={domain}>{domain}</option>
        ))}
      </select>

      {multiple && selectedDomains.length > 0 && (
        <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
          {selectedDomains.map(domain => (
            <div key={domain} style={{
              background: 'var(--primary-accent)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}>
              {domain}
              <button 
                type="button" 
                onClick={() => removeDomain(domain)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DomainSelector;
