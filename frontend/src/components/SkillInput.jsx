// Handles comma separated skill input
import React, { useState } from 'react';

const skillPlaceholders = {
  'Engineering & Technology': 'e.g. Artificial Intelligence, Web Development',
  'Creative Arts': 'e.g. Graphic Design, Photography',
  'Music & Dance': 'e.g. Singing, Hip Hop Dance',
  'Sports & Fitness': 'e.g. Cricket, Weight Training',
  'Health & Wellness': 'e.g. Yoga, Nutrition',
  'Food & Cooking': 'e.g. Baking, South Indian Cooking',
  'Lifestyle & Hobbies': 'e.g. Traveling, Gardening',
  'Business & Entrepreneurship': 'e.g. Startup Building, Marketing',
  'Education & Learning': 'e.g. Teaching, Public Speaking',
  'Media & Content Creation': 'e.g. Video Editing, Content Creation',
  'Communication & Public Speaking': 'e.g. Debating, Storytelling',
  'Social Impact & Community': 'e.g. Volunteering, Community Organizing'
};

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
        placeholder={skillPlaceholders[domain] || 'e.g. Artificial Intelligence, Web Development'}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
};

export default SkillInput;
