import React from 'react';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import { generateSyntheticBedPhotoBlob } from '../../services/storage';
import type { HospitalCase, TurnaroundPriority } from '../../types';

type Checklist = NonNullable<HospitalCase['housekeepingChecklist']>;
type ChecklistKey = keyof Checklist;

const checklistItems: { key: ChecklistKey; label: string }[] = [
  { key: 'linenRemoved', label: 'Remove used linen' },
  { key: 'surfacesDisinfected', label: 'Disinfect bed and touch surfaces' },
  { key: 'bedRailsSanitized', label: 'Sanitize rails and controls' },
  { key: 'wasteDisposed', label: 'Remove waste and replace liners' },
  { key: 'fixturesChecked', label: 'Check room fixtures and supplies' },
];
const emptyChecklist = (): Checklist => ({
  linenRemoved: false,
  surfacesDisinfected: false,
  bedRailsSanitized: false,
  wasteDisposed: false,
  fixturesChecked: false,
});
const priorityRank: Record<TurnaroundPriority, number> = {
  URGENT: 0,
  HIGH_TURNOVER: 1,
  NORMAL: 2,
};
const stamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : '-';

export const HousekeepingPanel: React.FC = () => {
  const {
    cases,
    claimHousekeepingTask,
    startCleaning,
    updateHousekeepingChecklist,
    uploadPhoto,
  } = useHospitalFlow();
  const { alerts, createWardCleaningCall } = useOperations();
  const [callWard, setCallWard] = React.useState('Ward 4B');
  const [callNote, setCallNote] = React.useState('');
  const [callMessage, setCallMessage] = React.useState('');

  const tasks = cases
    .filter(
      (item) =>
        item.departureConfirmed &&
        (item.status === 'CLEANING_IN_PROGRESS' ||
          item.status === 'REJECTED_RECLEAN'),
    )
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const awaitingReview = cases.filter(
    (item) => item.departureConfirmed && item.status === 'AWAITING_REVIEW',
  );
  const cleaningCalls = alerts.filter(
    (item) =>
      item.category === 'FACILITY_SAFETY' && item.status !== 'RESOLVED',
  );

  const updateChecklist = (
    task: HospitalCase,
    key: ChecklistKey,
    checked: boolean,
  ) => {
    updateHousekeepingChecklist(task.id, {
      ...(task.housekeepingChecklist || emptyChecklist()),
      [key]: checked,
    });
  };

  const submitCleaningCall = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createWardCleaningCall(callWard, callNote.trim());
    setCallMessage(
      result.success
        ? 'Cleaning call recorded in this browser.'
        : result.error || 'Could not add call.',
    );
    if (result.success) setCallNote('');
  };

  return (
    <div className="role-workspace">
      <div className="role-intro">
        <div>
          <span className="role-kicker">HOUSEKEEPING OPERATIONS</span>
          <h2>Cleaning task queue</h2>
          <p>
            Discharge tasks appear after confirmed room departure. Ward calls
            are listed below.
          </p>
        </div>
        <span className="demo-source-pill">
          Local demo - coordinator approval required
        </span>
      </div>

      <div className="role-metrics">
        <article>
          <span>Urgent turnover</span>
          <strong>{tasks.filter((item) => item.priority === 'URGENT').length}</strong>
          <small>Priority from bed case</small>
        </article>
        <article>
          <span>Tasks to claim</span>
          <strong>{tasks.filter((item) => !item.housekeepingClaimedBy).length}</strong>
          <small>Confirmed departures only</small>
        </article>
        <article>
          <span>Coordinator review</span>
          <strong>{awaitingReview.length}</strong>
          <small>Read-only queue</small>
        </article>
        <article>
          <span>Ward cleaning calls</span>
          <strong>{cleaningCalls.length}</strong>
          <small>Open facility alerts</small>
        </article>
      </div>

      <section className="role-card housekeeping-queue">
        <header>
          <div>
            <h3>Priority queue</h3>
            <p>Urgent turnover first - synthetic bed references only.</p>
          </div>
        </header>
        {tasks.map((task) => {
          const checklist = task.housekeepingChecklist || emptyChecklist();
          const checklistComplete = checklistItems.every(
            (item) => checklist[item.key],
          );
          const reCleanRequested = task.status === 'REJECTED_RECLEAN';

          return (
            <article className="housekeeping-task" key={task.id}>
              <div className="task-heading">
                <div>
                  <span className="role-kicker">
                    {task.caseRef} - {task.priority.replaceAll('_', ' ')}
                  </span>
                  <h3>{task.ward} / {task.room} / {task.bed}</h3>
                </div>
                <b className="role-status">
                  {reCleanRequested
                    ? 'RE-CLEAN REQUESTED'
                    : task.cleaningStarted
                      ? 'CLEANING IN PROGRESS'
                      : 'READY TO CLAIM'}
                </b>
              </div>

              <div className="task-times">
                <span>Departure <b>{stamp(task.departureConfirmedAt)}</b></span>
                <span>Claimed <b>{stamp(task.housekeepingClaimedAt)}</b></span>
                <span>Cleaning started <b>{stamp(task.cleaningStartedAt)}</b></span>
              </div>

              {reCleanRequested && (
                <p className="task-reclean">
                  Re-clean requested:{' '}
                  {task.rejectionDetails ||
                    task.rejectionReason ||
                    'Repeat room cleaning and checklist.'}
                </p>
              )}

              {!task.housekeepingClaimedBy ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => claimHousekeepingTask(task.id)}
                >
                  Claim task
                </button>
              ) : (
                <p className="task-claimed">
                  Assigned to {task.housekeepingClaimedBy}
                </p>
              )}

              {task.housekeepingClaimedBy &&
                (!task.cleaningStarted || reCleanRequested) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => startCleaning(task.id)}
                  >
                    {reCleanRequested ? 'Start re-clean' : 'Start cleaning'}
                  </button>
                )}

              {task.cleaningStarted && (
                <div className="task-checklist">
                  <h4>Cleaning checklist</h4>
                  {checklistItems.map((item) => (
                    <label key={item.key}>
                      <input
                        type="checkbox"
                        checked={Boolean(checklist[item.key])}
                        onChange={(event) =>
                          updateChecklist(task, item.key, event.target.checked)
                        }
                      />
                      {item.label}
                    </label>
                  ))}

                  {checklistComplete && (
                    <div className="task-photo-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          uploadPhoto(
                            task.id,
                            generateSyntheticBedPhotoBlob(
                              task.caseRef,
                              task.bed,
                            ),
                            'image/svg+xml',
                          )
                        }
                      >
                        Submit with synthetic room photo (demo)
                      </button>
                      <label className="task-photo">
                        Or upload room-only evidence
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={async (event) => {
                            const file = event.currentTarget.files?.[0];
                            if (file) {
                              await uploadPhoto(task.id, file, file.type);
                            }
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <small>
                    {checklistComplete
                      ? 'Submission moves the case to coordinator review; housekeeping cannot approve a bed.'
                      : 'Complete every check before submission.'}
                  </small>
                </div>
              )}
            </article>
          );
        })}
        {!tasks.length && (
          <p className="role-empty">
            No confirmed departures are waiting for housekeeping.
          </p>
        )}
      </section>

      <section className="role-card role-review">
        <header>
          <div>
            <h3>Awaiting coordinator approval</h3>
            <p>Only a coordinator can approve a bed or request a re-clean.</p>
          </div>
        </header>
        {awaitingReview.map((task) => (
          <div className="role-row" key={task.id}>
            <div>
              <strong>{task.ward} / {task.bed} / {task.caseRef}</strong>
              <small>Submitted {stamp(task.photoUploadedAt)}</small>
            </div>
            <b className="role-status">AWAITING REVIEW</b>
          </div>
        ))}
        {!awaitingReview.length && (
          <p className="role-empty">No tasks awaiting review.</p>
        )}
      </section>

      <section className="role-card">
        <header>
          <div>
            <h3>Ward cleaning calls</h3>
            <p>New requests are added to the shared local alert stream.</p>
          </div>
        </header>
        <form className="ward-call-form" onSubmit={submitCleaningCall}>
          <label>
            Ward
            <select
              value={callWard}
              onChange={(event) => setCallWard(event.target.value)}
            >
              <option>Ward 4B</option>
              <option>Ward 1</option>
              <option>ICU Ward 5A</option>
              <option>Trauma Bay</option>
            </select>
          </label>
          <label>
            Cleaning request
            <input
              value={callNote}
              onChange={(event) => setCallNote(event.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Spill cleanup near station"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-sm">
            Create cleaning call
          </button>
        </form>
        {callMessage && (
          <p className="role-call-message" role="status">{callMessage}</p>
        )}
        {cleaningCalls.map((call) => (
          <div className="role-row" key={call.id}>
            <div>
              <strong>{call.title}</strong>
              <small>{call.department} - {call.summary}</small>
            </div>
            <b className="role-status">{call.severity}</b>
          </div>
        ))}
        {!cleaningCalls.length && (
          <p className="role-empty">No open ward cleaning calls.</p>
        )}
      </section>

      <p className="role-boundary">
        This is a local prototype queue, not production dispatch. Bed Ready is
        never available to housekeeping.
      </p>
    </div>
  );
};
