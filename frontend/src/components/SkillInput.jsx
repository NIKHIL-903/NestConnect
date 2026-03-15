// Handles comma separated skill input
import React, { useState } from 'react';

const SkillInput = ({ domain, skills, onChange }) => {
  const [inputValue, setInputValue] = useState(skills.join(', '));

  const handleChange = (e) => {
    setInputValue(e.target.value);
    // Convert comma separated string to array, remove empty
    const skillsArray = e.target.value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    onChange(skillsArray);
  };

  return (
    <div className="mb-1">
      <label className="text-sm text-muted mb-1" style={{ display: 'block' }}>
        Skills for {domain} (comma separated)
      </label>
      <input
        type="text"
        className="input-field"
        placeholder="e.g. React, Node.js, AI"
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
};

export default SkillInput;
