'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  Building2, 
  Users, 
  FolderPlus, 
  UserCheck, 
  ClipboardList, 
  Copy, 
  Check, 
  Send 
} from 'lucide-react';

type Batch = { id: string; name: string };
type Department = { id: string; name: string };

export default function ManagerTools({ 
  organizationId, 
  role, 
  batches, 
  departments 
}: { 
  organizationId: string; 
  role: string; 
  batches: Batch[]; 
  departments: Department[]; 
}) {
  const [member, setMember] = useState(''); 
  const [memberRole, setMemberRole] = useState<'student' | 'mentor' | 'admin'>('student');
  
  const [inviteEmail, setInviteEmail] = useState(''); 
  const [inviteRole, setInviteRole] = useState<'student' | 'mentor' | 'admin'>('student');
  
  const [batch, setBatch] = useState(''); 
  const [batchId, setBatchId] = useState(''); 
  const [batchMember, setBatchMember] = useState(''); 
  const [department, setDepartment] = useState('');
  
  const [assignment, setAssignment] = useState(''); 
  const [assignmentBatch, setAssignmentBatch] = useState(''); 
  const [targetType, setTargetType] = useState('skill'); 
  
  const [message, setMessage] = useState(''); 
  const [inviteLink, setInviteLink] = useState(''); 
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const canManage = ['owner', 'admin', 'mentor'].includes(role);
  const canStructure = isOwner || isAdmin;

  if (!canManage) return null;

  async function act(action: string, extra: any) {
    setBusy(true); 
    setMessage(''); 
    setInviteLink('');
    try {
      const r = await fetch('/api/organization/manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, organizationId, ...extra })
      });
      const d = await r.json();
      
      if (r.ok) {
        setMessage('Action executed successfully.');
        if (action === 'create_invite' && d.invitePath) { 
          setInviteLink(`${window.location.origin}${d.invitePath}`); 
        }
        if (action === 'create_batch') setBatch('');
        if (action === 'create_department') setDepartment('');
        if (action === 'add_batch_member') setBatchMember('');
        if (action === 'create_assignment') setAssignment('');
        if (action === 'add_member') setMember('');
      } else {
        setMessage(d.error ?? 'Could not perform operation');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setBusy(false);
    }
  }

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500";
  const selectStyle = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200";
  const btnStyle = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600";
  const cardStyle = "rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40 space-y-3 font-sans text-xs antialiased";

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {/* Create Invite */}
        {canStructure && (
          <div className={cardStyle}>
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
              <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Invite Member</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Generate a secure one-time invitation URL.</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                placeholder="Email address (optional)" 
                className={inputStyle} 
              />
              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value as any)} 
                className={selectStyle}
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
                {isOwner && <option value="admin">Admin</option>}
              </select>
            </div>

            <div className="flex justify-end pt-1">
              <button 
                disabled={busy} 
                onClick={() => act('create_invite', { email: inviteEmail || null, role: inviteRole })} 
                className={btnStyle}
              >
                <Send size={13} />
                <span>Create Invite</span>
              </button>
            </div>

            {inviteLink && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="break-all font-mono text-[11px] text-emerald-800 dark:text-emerald-300">{inviteLink}</p>
                <button 
                  onClick={copyInviteLink} 
                  className="shrink-0 rounded-md border border-emerald-300 bg-white p-1 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Department Management */}
        {canStructure && (
          <div className={cardStyle}>
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
              <Building2 size={16} className="text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Departments</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Organize students and batches into academic departments.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
                placeholder="e.g. Computer Science" 
                className={inputStyle} 
              />
              <button 
                disabled={busy || department.trim().length < 2} 
                onClick={() => act('create_department', { name: department })} 
                className={btnStyle}
              >
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {departments.length ? (
                departments.map((d) => (
                  <span key={d.id} className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {d.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">No departments created yet.</span>
              )}
            </div>
          </div>
        )}

        {/* Add Existing Member */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
            <UserCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Add Existing Member</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Add a platform user using their account UUID.</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input 
              value={member} 
              onChange={(e) => setMember(e.target.value)} 
              placeholder="User Account UUID" 
              className={inputStyle} 
            />
            <select 
              value={memberRole} 
              onChange={(e) => setMemberRole(e.target.value as any)} 
              className={selectStyle}
            >
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              {isOwner && <option value="admin">Admin</option>}
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button 
              disabled={busy || !member.trim()} 
              onClick={() => act('add_member', { memberUserId: member, role: memberRole })} 
              className={btnStyle}
            >
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Create Batch */}
        {canStructure && (
          <div className={cardStyle}>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Create Batch</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Group learners into cohorts.</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{batches.length} Batches</span>
            </div>

            <div className="flex gap-2">
              <input 
                value={batch} 
                onChange={(e) => setBatch(e.target.value)} 
                placeholder="e.g. BCA 2026 - Section A" 
                className={inputStyle} 
              />
              <button 
                disabled={busy || !batch.trim()} 
                onClick={() => act('create_batch', { name: batch })} 
                className={btnStyle}
              >
                <span>Create</span>
              </button>
            </div>
          </div>
        )}

        {/* Add Student to Batch */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
            <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Assign to Batch</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Enroll a student into a specific batch cohort.</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <select 
              value={batchId} 
              onChange={(e) => setBatchId(e.target.value)} 
              className={selectStyle}
            >
              <option value="">Select Target Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <input 
              value={batchMember} 
              onChange={(e) => setBatchMember(e.target.value)} 
              placeholder="Student User UUID" 
              className={inputStyle} 
            />
          </div>

          <div className="flex justify-end pt-1">
            <button 
              disabled={busy || !batchId || !batchMember.trim()} 
              onClick={() => act('add_batch_member', { batchId, memberUserId: batchMember })} 
              className={btnStyle}
            >
              <span>Assign Student</span>
            </button>
          </div>
        </div>

        {/* Create Assignment */}
        <div className={`${cardStyle} lg:col-span-2`}>
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 dark:border-slate-800">
            <ClipboardList size={16} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">Publish Assignment</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Broadcast learning tasks to a batch cohort or all organization members.</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <input 
              value={assignment} 
              onChange={(e) => setAssignment(e.target.value)} 
              placeholder="e.g. Graph BFS Practice Task" 
              className={inputStyle} 
            />

            <select 
              value={assignmentBatch} 
              onChange={(e) => setAssignmentBatch(e.target.value)} 
              className={selectStyle}
            >
              <option value="">All Organization Members</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select 
              value={targetType} 
              onChange={(e) => setTargetType(e.target.value)} 
              className={selectStyle}
            >
              <option value="skill">Skill</option>
              <option value="topic">Topic</option>
              <option value="test">Assessment</option>
              <option value="dsa">DSA</option>
              <option value="project">Project</option>
              <option value="course">Course</option>
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button 
              disabled={busy || !assignment.trim()} 
              onClick={() => act('create_assignment', { title: assignment, targetType, batchId: assignmentBatch || null })} 
              className={btnStyle}
            >
              <ClipboardList size={13} />
              <span>Publish Assignment</span>
            </button>
          </div>
        </div>
      </section>

      {/* Operation Feedback Toast */}
      {message && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-900 p-3 text-xs text-white dark:border-slate-800">
          <p className="font-medium">{message}</p>
        </div>
      )}
    </div>
  );
}