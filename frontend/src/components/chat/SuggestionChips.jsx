// frontend/src/components/chat/SuggestionChips.jsx
/**
 * Contextual suggestion chips — focused on election EDUCATION
 * (understanding the process, timelines, and steps).
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CHIP_GROUPS = [
  {
    label: '📋 Process',
    chips: [
      { emoji: '🗓️', text: 'Explain the full election timeline step by step' },
      { emoji: '🗳️', text: 'How does voting work on election day?' },
      { emoji: '📟', text: 'How does the EVM and VVPAT work?' },
      { emoji: '📊', text: 'How are votes counted after polling?' },
    ],
  },
  {
    label: '📝 Registration',
    chips: [
      { emoji: '📝', text: 'How do I register as a new voter?' },
      { emoji: '🔍', text: 'How to check my name in voter list?' },
      { emoji: '✏️', text: 'How to correct errors in my Voter ID?' },
      { emoji: '🌏', text: 'How can NRIs vote in Indian elections?' },
    ],
  },
  {
    label: '📍 On the Day',
    chips: [
      { emoji: '📍', text: 'How do I find my polling booth?' },
      { emoji: '🪪', text: 'What documents do I need to vote?' },
      { emoji: '⏰', text: 'What are the polling booth timings?' },
      { emoji: '♿', text: 'What facilities exist for elderly and PwD voters?' },
    ],
  },
  {
    label: '🏛️ Understand',
    chips: [
      { emoji: '🏛️', text: 'What is the Model Code of Conduct?' },
      { emoji: '🚫', text: 'What is NOTA and how does it work?' },
      { emoji: '📮', text: 'What is postal ballot voting?' },
      { emoji: '🔒', text: 'Are EVMs tamper-proof? Explain.' },
    ],
  },
];

export default function SuggestionChips({ onSelect }) {
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <div className="px-4 pb-3">
      {/* Group tabs */}
      <div className="flex gap-1.5 mb-2.5 overflow-x-auto no-scrollbar">
        {CHIP_GROUPS.map((g, i) => (
          <button key={i} onClick={() => setActiveGroup(i)}
            className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full font-dm font-semibold transition-all duration-150"
            style={{
              background: activeGroup === i ? 'rgba(255,153,51,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeGroup === i ? 'rgba(255,153,51,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: activeGroup === i ? '#FF9933' : 'var(--text-muted)',
            }}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Chips */}
      <AnimatePresence mode="wait">
        <motion.div key={activeGroup}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="flex flex-wrap gap-1.5">
          {CHIP_GROUPS[activeGroup].chips.map(({ emoji, text }, i) => (
            <motion.button
              key={text}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(`${emoji} ${text}`)}
              className="text-xs px-3 py-1.5 rounded-full font-dm transition-all duration-150"
              style={{
                background: 'rgba(255,153,51,0.06)',
                border: '1px solid rgba(255,153,51,0.2)',
                color: '#cbd5e1',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,153,51,0.14)';
                e.currentTarget.style.borderColor = 'rgba(255,153,51,0.4)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,153,51,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,153,51,0.2)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              {emoji} {text}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
