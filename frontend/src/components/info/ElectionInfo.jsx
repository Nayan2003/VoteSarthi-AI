// frontend/src/components/info/ElectionInfo.jsx
/**
 * Interactive Election Process page — the core educational feature.
 *
 * Sections:
 *  1. Election Timeline    — animated vertical timeline of the full election cycle
 *  2. How to Vote Wizard   — step-by-step voting guide with expandable detail
 *  3. Register to Vote     — NVSP / Form 6 walkthrough
 *  4. Voting Rules FAQ     — accordion FAQ
 *  5. Key Bodies           — ECI, CEC, BLO, RO roles
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, ChevronDown, ChevronRight,
  ExternalLink, Info, Users, BookOpen, ListChecks,
  Landmark, Vote, ClipboardList, MapPin, Shield,
  Fingerprint, Clock, AlertCircle, Star,
} from 'lucide-react';

// ── DATA ──────────────────────────────────────────────────────────────────────

const ELECTION_TIMELINE = [
  {
    phase: 'Election Announcement',
    icon: '📢',
    color: '#FF9933',
    days: 'Day 0',
    description: 'Election Commission of India announces the election schedule. The Model Code of Conduct (MCC) comes into force immediately.',
    details: [
      'ECI issues the official notification in the Gazette',
      'Model Code of Conduct (MCC) activates — restricts ruling party from making new announcements',
      'Date of poll, counting date, and result date are declared',
      'Schedule is announced for each phase if multi-phase',
    ],
  },
  {
    phase: 'Voter List Finalisation',
    icon: '📋',
    color: '#f59e0b',
    days: 'Day 0 – 7',
    description: 'Final Electoral Roll is published. Last chance to check your name, add corrections (Form 8), or register (Form 6).',
    details: [
      'Check your name at voters.eci.gov.in or Voter Helpline App',
      'Submit Form 6 (new registration) if your name is missing',
      'Submit Form 8 (correction) for errors in name/address/photo',
      'BLO (Booth Level Officer) verifies applications',
    ],
  },
  {
    phase: 'Nomination Filing',
    icon: '📝',
    color: '#3b82f6',
    days: 'Day 7 – 14',
    description: 'Candidates file nomination papers with the Returning Officer (RO). Each candidate needs a proposer and must deposit a security amount.',
    details: [
      'Candidates file nomination in Form 2B with the Returning Officer',
      'Security deposit: ₹25,000 for Lok Sabha / ₹10,000 for State Assembly (SC/ST: 50% off)',
      'Nomination must be proposed by at least one registered voter of that constituency',
      'Affidavit of criminal/financial record (Form 26) is mandatory',
    ],
  },
  {
    phase: 'Scrutiny of Nominations',
    icon: '🔍',
    color: '#8b5cf6',
    days: 'Day 15',
    description: 'Returning Officer checks validity of all nominations. Defective nominations can be rejected here.',
    details: [
      'RO examines each nomination for completeness and eligibility',
      'Objections against any nomination can be raised on the scrutiny day',
      'Nominations with defects (wrong form, improper signature) are rejected',
      'RO announces a list of valid and rejected nominations',
    ],
  },
  {
    phase: 'Withdrawal of Candidature',
    icon: '🚪',
    color: '#ec4899',
    days: 'Day 16 – 17',
    description: 'Candidates can withdraw their candidature within 2 days of scrutiny. After this, the final contest list is published.',
    details: [
      'Candidates can withdraw by submitting Form 5 to the RO',
      'Cannot withdraw after the withdrawal deadline',
      'Final list of contesting candidates is released as the official ballot list',
      'Election symbols are allotted by ECI to parties/candidates',
    ],
  },
  {
    phase: 'Election Campaign',
    icon: '📣',
    color: '#10b981',
    days: 'Day 17 – D-2',
    description: 'Parties and candidates campaign. The Model Code of Conduct governs all campaign activities. Campaign ends 48 hours before polling.',
    details: [
      'Rallies, road shows, door-to-door canvassing are allowed with permissions',
      'Campaign expenses must be tracked and filed with the ECI',
      'No hate speech, communal appeals, or government resource misuse',
      'Campaign silence period: 48 hours before polling day ("campaign ban period")',
    ],
  },
  {
    phase: 'Polling Day',
    icon: '🗳️',
    color: '#FF9933',
    days: 'Polling Day',
    description: 'Citizens cast votes at their assigned booths. Booths are open from 7 AM to 6 PM. You need your EPIC or any valid photo ID.',
    details: [
      'Carry your EPIC (Voter ID) or any approved photo ID + your Booth Slip',
      'Polling officers verify your identity and make an entry in the register',
      'You receive a Ballot Number Slip and proceed to the EVM',
      'Press the button next to your candidate — VVPAT prints a 7-second paper confirmation',
      'Indelible ink is applied to your left index finger',
    ],
  },
  {
    phase: 'Vote Counting & Results',
    icon: '📊',
    color: '#22c55e',
    days: 'Counting Day',
    description: 'EVMs are brought to counting centres. Postal ballots are counted first, then EVM votes. Results are declared round by round.',
    details: [
      'Postal ballots (from service voters, PwD, elderly) are counted first',
      'EVM counting happens simultaneously at multiple tables (usually 14 tables per round)',
      'Each round declares results for approximately 1000–1200 votes',
      'Candidate with the highest votes in FPTP system wins (no minimum % required)',
      'Winning certificate (Form 22) is issued by the RO',
    ],
  },
];

const VOTING_WIZARD_STEPS = [
  {
    step: 1,
    title: 'Before You Go',
    icon: ClipboardList,
    color: '#FF9933',
    tasks: [
      { text: 'Check your name on electoral roll at voters.eci.gov.in', link: 'https://voters.eci.gov.in' },
      { text: 'Download / collect your Booth Slip (shows booth address + serial number)', link: null },
      { text: 'Keep your EPIC (Voter ID) or one of 12 approved ID proofs ready', link: null },
      { text: 'Check polling booth location on VoteSarthi Map tab 📍', link: null },
      { text: 'Note polling hours — generally 7:00 AM to 6:00 PM', link: null },
    ],
  },
  {
    step: 2,
    title: 'At the Polling Booth',
    icon: MapPin,
    color: '#3b82f6',
    tasks: [
      { text: 'Join the queue outside your assigned polling booth (check your Booth Slip)', link: null },
      { text: 'Enter when called — show ID to the 1st Polling Officer', link: null },
      { text: 'Officer marks your name in the electoral roll and gives you a Ballot Slip', link: null },
      { text: 'Proceed to the 2nd Officer — they apply indelible ink to your left index finger', link: null },
      { text: 'Move to the Presiding Officer / 3rd Officer — they authorise the Balloting Unit', link: null },
    ],
  },
  {
    step: 3,
    title: 'Casting Your Vote (EVM)',
    icon: Vote,
    color: '#22c55e',
    tasks: [
      { text: 'Enter the voting compartment — it is completely private', link: null },
      { text: 'Look at the Balloting Unit — candidates are listed with their name, symbol, and party', link: null },
      { text: 'Press the BLUE button next to your chosen candidate', link: null },
      { text: 'A RED light glows and a BEEP sound confirms your vote is recorded', link: null },
      { text: 'Check the VVPAT screen — a paper slip shows your candidate\'s symbol for 7 seconds', link: null },
      { text: 'Exit the compartment — you have voted! 🎉', link: null },
    ],
  },
  {
    step: 4,
    title: 'What is NOTA?',
    icon: Shield,
    color: '#8b5cf6',
    tasks: [
      { text: 'NOTA = "None Of The Above" — the last button on every EVM', link: null },
      { text: 'Introduced by Supreme Court order in 2013 (PUCL vs Union of India)', link: null },
      { text: 'Pressing NOTA records your dissatisfaction with ALL candidates', link: null },
      { text: 'NOTA votes are counted and published but do NOT affect the result', link: null },
      { text: 'Even if NOTA gets the most votes, the candidate with next highest votes wins', link: null },
    ],
  },
];

const REGISTRATION_STEPS = [
  { n: '01', title: 'Check Eligibility',   desc: 'You must be an Indian citizen, 18+ years old, and a resident of the constituency you are registering in.' },
  { n: '02', title: 'Visit NVSP Portal',   desc: 'Go to voters.eci.gov.in or open the Voter Helpline App. Click "New Registration" (Form 6).' },
  { n: '03', title: 'Fill Form 6',         desc: 'Enter your personal details, address, and date of birth. Upload a recent passport-size photo and proof of age + address.' },
  { n: '04', title: 'Submit & Track',      desc: 'Submit online. You get an Application Reference Number. Track status at the same portal. BLO may visit to verify.' },
  { n: '05', title: 'Collect EPIC Card',   desc: 'Once approved (typically 30–60 days), collect your EPIC (Voter ID card) from your local ERO office, or it may be delivered.' },
];

const FAQ = [
  { q: 'Who is the Chief Election Commissioner?',  a: 'As of 2025, Rajiv Kumar is the Chief Election Commissioner of India. The CEC is appointed by the President of India and cannot be removed except through a process similar to a Supreme Court judge.' },
  { q: 'What is the Model Code of Conduct (MCC)?', a: 'The MCC is a set of guidelines issued by the ECI that governs the conduct of political parties and candidates during election time. It comes into force from the date of election announcement and ends when results are declared. It prevents the ruling party from using government resources for campaigning.' },
  { q: 'Can I vote if my name is not in the list?', a: 'No. Your name must appear in the electoral roll. If it is missing, register at voters.eci.gov.in (Form 6) before the deadline. On polling day itself, you cannot vote if your name is not in the roll — even with valid ID.' },
  { q: 'What is a Booth Level Officer (BLO)?',      a: 'A BLO is a government employee assigned to each polling booth (usually 1 BLO per 1000–1200 voters). They maintain the electoral roll, add/correct voter entries, deliver voter slips, and assist voters. You can contact your BLO for any registration issue.' },
  { q: 'Are EVMs tamper-proof?',                    a: 'EVMs are standalone devices with no WiFi, Bluetooth, or internet connectivity. They cannot be networked or remotely controlled. The ECI conducts First Level Checks, Randomisation, and Mock Polls before every election. Political parties can appoint agents to observe every stage. The VVPAT paper trail provides independent physical verification.' },
  { q: 'What is the VVPAT?',                        a: 'Voter Verifiable Paper Audit Trail — a printer attached to the EVM Balloting Unit. When you press a button, VVPAT prints a paper slip showing your candidate\'s serial number, name, and election symbol, visible through a glass window for 7 seconds, then drops into a sealed box. This provides a physical audit trail.' },
  { q: 'Who can use Postal Ballot?',                a: 'Service voters (armed forces, CAPF, government employees posted outside constituency), senior citizens aged 85+, persons with disabilities (PwD), and COVID/essential service workers during pandemic elections are eligible for postal ballot. They vote by post and their ballots are counted first on counting day.' },
];

const KEY_BODIES = [
  { name: 'Election Commission of India (ECI)', role: 'Constitutional body that oversees all elections to Parliament and State Assemblies. Autonomous — not under any ministry.', icon: '🏛️', color: '#FF9933' },
  { name: 'Chief Election Commissioner (CEC)',  role: 'Head of ECI. Appointed by President of India. Security of tenure equal to a Supreme Court judge.', icon: '👨‍⚖️', color: '#f59e0b' },
  { name: 'Returning Officer (RO)',             role: 'District Magistrate or equivalent officer appointed for each constituency. Oversees nominations, scrutiny, and result declaration.', icon: '📋', color: '#3b82f6' },
  { name: 'Booth Level Officer (BLO)',          role: 'Government employee managing one polling booth area (~1200 voters). Maintains the electoral roll, delivers voter slips, assists in registrations.', icon: '👤', color: '#8b5cf6' },
  { name: 'Presiding Officer',                  role: 'In-charge of a single polling booth on election day. Conducts mock poll, ensures EVM is sealed, supervises entire polling process.', icon: '🛡️', color: '#22c55e' },
];

// ── SECTION CONFIG ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'timeline',  label: 'Election Timeline', Icon: Calendar      },
  { id: 'voting',    label: 'How to Vote',        Icon: Vote          },
  { id: 'register',  label: 'Register to Vote',   Icon: ClipboardList },
  { id: 'faq',       label: 'FAQ',                Icon: BookOpen      },
  { id: 'bodies',    label: 'Key Bodies',          Icon: Landmark      },
];

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function TimelinePhase({ phase, index, expanded, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="flex gap-4"
    >
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(index)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg flex-shrink-0 z-10"
          style={{
            background: `linear-gradient(135deg, ${phase.color}33, ${phase.color}11)`,
            border: `2px solid ${phase.color}55`,
            boxShadow: expanded ? `0 0 18px ${phase.color}44` : 'none',
          }}
          title={phase.phase}
        >{phase.icon}</motion.button>
        {index < ELECTION_TIMELINE.length - 1 && (
          <div className="w-0.5 flex-1 my-1 min-h-[28px]"
               style={{ background: `linear-gradient(180deg, ${phase.color}44, transparent)` }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <button onClick={() => onToggle(index)}
          className="w-full text-left group flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-syne font-bold text-sm" style={{ color: phase.color }}>
                {phase.days}
              </span>
              <span className="text-[10px] font-dm px-2 py-0.5 rounded-full"
                    style={{ background: `${phase.color}18`, color: phase.color, border: `1px solid ${phase.color}33` }}>
                Phase {index + 1} of {ELECTION_TIMELINE.length}
              </span>
            </div>
            <h3 className="font-syne font-semibold text-white text-sm">{phase.phase}</h3>
            <p className="text-xs font-dm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {phase.description}
            </p>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
            className="flex-shrink-0 mt-1" style={{ color: 'var(--text-muted)' }}>
            <ChevronDown size={15} />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <ul className="mt-3 space-y-2 pl-1">
                {phase.details.map((d, i) => (
                  <motion.li key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs font-dm leading-relaxed"
                    style={{ color: '#94a3b8' }}
                  >
                    <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" style={{ color: phase.color }} />
                    {d}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function WizardStep({ step, active, onSelect }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (step.step - 1) * 0.07 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: active ? `${step.color}10` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? step.color + '44' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button onClick={() => onSelect(step.step)}
        className="w-full p-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${step.color}20`, border: `1px solid ${step.color}33` }}>
          <Icon size={18} style={{ color: step.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-syne font-bold tracking-wider uppercase"
                  style={{ color: step.color }}>Step {step.step}</span>
          </div>
          <p className="font-syne font-semibold text-sm text-white">{step.title}</p>
        </div>
        <motion.div animate={{ rotate: active ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0">
              <div className="w-full h-px mb-4" style={{ background: `${step.color}22` }} />
              <ul className="space-y-2.5">
                {step.tasks.map((task, i) => (
                  <motion.li key={i}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-2.5 text-xs font-dm leading-relaxed"
                    style={{ color: '#cbd5e1' }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                         style={{ background: `${step.color}25`, color: step.color }}>
                      {i + 1}
                    </div>
                    <span className="flex-1">
                      {task.text}
                      {task.link && (
                        <a href={task.link} target="_blank" rel="noreferrer"
                          className="ml-1 inline-flex items-center gap-0.5 hover:underline"
                          style={{ color: step.color }}>
                          <ExternalLink size={10} /> Open
                        </a>
                      )}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function ElectionInfo() {
  const [section,         setSection]         = useState('timeline');
  const [expandedPhase,   setExpandedPhase]   = useState(0);     // timeline
  const [activeWizard,    setActiveWizard]    = useState(1);     // wizard
  const [openFaq,         setOpenFaq]         = useState(null);  // faq

  const togglePhase  = (i) => setExpandedPhase(expandedPhase === i ? null : i);
  const toggleWizard = (s) => setActiveWizard(activeWizard === s ? null : s);
  const toggleFaq    = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl flex-shrink-0"
               style={{ background: 'rgba(255,153,51,0.12)', border: '1px solid rgba(255,153,51,0.28)' }}>
            <Info size={24} style={{ color: '#FF9933' }} />
          </div>
          <div>
            <h2 className="font-syne text-xl font-bold leading-tight">
              Understanding the Election Process
            </h2>
            <p className="text-xs font-dm mt-1" style={{ color: 'var(--text-muted)' }}>
              Interactive guide — timelines, how to vote, registration, and more
            </p>
          </div>
        </div>

        {/* ── Section Tabs ── */}
        <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 rounded-2xl"
             style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {SECTIONS.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-dm font-semibold transition-all duration-200"
                style={{ color: active ? 'white' : 'var(--text-muted)', flex: '1 1 auto', justifyContent: 'center' }}>
                {active && (
                  <motion.div layoutId="info-pill" className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(255,153,51,0.2), rgba(19,136,8,0.14))' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }} />
                )}
                <Icon size={12} className="relative z-10 flex-shrink-0" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Section Content ── */}
        <AnimatePresence mode="wait">

          {/* TIMELINE */}
          {section === 'timeline' && (
            <motion.div key="timeline"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl p-5 mb-4"
                   style={{ borderColor: 'rgba(255,153,51,0.2)' }}>
                <p className="text-xs font-dm leading-relaxed" style={{ color: '#94a3b8' }}>
                  👆 <strong className="text-white">Tap any phase</strong> to expand the detailed steps.
                  A typical Indian election follows this 8-phase cycle from announcement to results.
                </p>
              </div>
              <div className="space-y-0">
                {ELECTION_TIMELINE.map((phase, i) => (
                  <TimelinePhase key={i} phase={phase} index={i}
                    expanded={expandedPhase === i} onToggle={togglePhase} />
                ))}
              </div>
            </motion.div>
          )}

          {/* HOW TO VOTE WIZARD */}
          {section === 'voting' && (
            <motion.div key="voting"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl p-5 mb-5"
                   style={{ borderColor: 'rgba(34,197,94,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Vote size={16} style={{ color: '#22c55e' }} />
                  <span className="font-syne font-bold text-sm text-white">Voting Day Checklist</span>
                </div>
                <p className="text-xs font-dm leading-relaxed" style={{ color: '#94a3b8' }}>
                  Follow these steps on election day. Expand each step for full detail.
                  You only need <strong className="text-white">a few minutes</strong> at the booth!
                </p>
              </div>
              <div className="space-y-3">
                {VOTING_WIZARD_STEPS.map(step => (
                  <WizardStep key={step.step} step={step}
                    active={activeWizard === step.step} onSelect={toggleWizard} />
                ))}
              </div>
              {/* Approved IDs box */}
              <div className="mt-5 rounded-2xl p-4"
                   style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Fingerprint size={15} style={{ color: '#60a5fa' }} />
                  <span className="font-syne font-semibold text-sm text-white">12 Approved Photo IDs</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['EPIC (Voter ID)', 'Aadhaar Card', 'Passport', 'Driving Licence',
                    'PAN Card', 'MNREGA Job Card', 'Passbook with Photo', 'Smart Card (RGI)',
                    'Service ID (Govt/PSU)', 'Pension Document', 'NPR Smart Card', 'Health Insurance Card (CGHS)']
                    .map(id => (
                      <div key={id} className="flex items-center gap-1.5 text-[11px] font-dm"
                           style={{ color: '#94a3b8' }}>
                        <CheckCircle2 size={10} style={{ color: '#60a5fa', flexShrink: 0 }} />
                        {id}
                      </div>
                    ))
                  }
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTER TO VOTE */}
          {section === 'register' && (
            <motion.div key="register"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl p-5 mb-5"
                   style={{ borderColor: 'rgba(255,153,51,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList size={16} style={{ color: '#FF9933' }} />
                  <span className="font-syne font-bold text-sm text-white">Register as a Voter — Step by Step</span>
                </div>
                <p className="text-xs font-dm" style={{ color: '#94a3b8' }}>
                  Eligible voters (18+, Indian citizen) must be on the electoral roll to vote.
                  Registration is free and takes ~10 minutes online.
                </p>
              </div>

              <div className="space-y-3">
                {REGISTRATION_STEPS.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex gap-4 rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-syne font-bold text-sm flex-shrink-0"
                         style={{ background: 'rgba(255,153,51,0.15)', color: '#FF9933', border: '1px solid rgba(255,153,51,0.3)' }}>
                      {s.n}
                    </div>
                    <div>
                      <p className="font-syne font-semibold text-sm text-white mb-1">{s.title}</p>
                      <p className="text-xs font-dm leading-relaxed" style={{ color: '#94a3b8' }}>{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <a href="https://voters.eci.gov.in" target="_blank" rel="noreferrer"
                  className="flex-1 btn-primary py-3 text-sm font-syne justify-center rounded-2xl">
                  <ExternalLink size={15} /> Register at NVSP Portal
                </a>
                <a href="https://play.google.com/store/apps/details?id=in.nic.eci.EnrollmentApp" target="_blank" rel="noreferrer"
                  className="flex-1 btn-ghost py-3 text-sm font-syne justify-center rounded-2xl">
                  📱 Voter Helpline App
                </a>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl"
                   style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                <p className="text-xs font-dm" style={{ color: '#fbbf24' }}>
                  <strong>Deadline:</strong> The last date to register is usually 30 days before the election notification date. Check eci.gov.in for current deadlines.
                </p>
              </div>
            </motion.div>
          )}

          {/* FAQ */}
          {section === 'faq' && (
            <motion.div key="faq"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-2">
                {FAQ.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={() => toggleFaq(i)}
                      className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-2">
                        <Star size={12} className="mt-1 flex-shrink-0" style={{ color: '#FF9933' }} />
                        <span className="font-dm font-medium text-sm text-white">{item.q}</span>
                      </div>
                      <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="px-4 pb-4 text-xs font-dm leading-relaxed"
                             style={{ color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* KEY BODIES */}
          {section === 'bodies' && (
            <motion.div key="bodies"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-3">
                {KEY_BODIES.map((body, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl p-5"
                    style={{
                      background: `${body.color}08`,
                      border: `1px solid ${body.color}28`,
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{body.icon}</span>
                      <div>
                        <h3 className="font-syne font-bold text-sm" style={{ color: body.color }}>
                          {body.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs font-dm leading-relaxed" style={{ color: '#94a3b8' }}>
                      {body.role}
                    </p>
                  </motion.div>
                ))}
              </div>

              <a href="https://eci.gov.in" target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl mt-6 text-sm font-dm font-medium transition-all"
                style={{ background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.25)', color: '#FF9933' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,153,51,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,153,51,0.08)'}>
                <ExternalLink size={14} />
                Visit Election Commission of India — eci.gov.in
              </a>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
