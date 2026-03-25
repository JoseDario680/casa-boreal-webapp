import React from 'react';

const Sidebar = ({ activeSection, setActiveSection }: { activeSection: string; setActiveSection: (section: string) => void }) => {
  const sections = ['profile', 'account', 'notifications', 'privacy', 'membership'];

  return (
    <div className="w-64 bg-casaCream p-4 rounded-2xl">
      <ul>
        {sections.map(section => (
          <li
            key={section}
            className={`p-2.5 cursor-pointer rounded-xl transition-all font-medium ${activeSection === section ? 'bg-casaCoffee text-white shadow-sm' : 'text-casaCoffee hover:bg-casaBeige'}`}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;