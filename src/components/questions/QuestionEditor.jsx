import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { renderAIGStem } from "@/components/aig/renderers";
import { renderAIGOption } from "@/components/aig/renderers";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Modal from "../ui/Modal";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import toast from "react-hot-toast";

import { useAuth } from "@/auth/AuthProvider";
import {
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useQuestionLifecycle,
  useSyncQuestionIrt,
} from "@/api/queries/questions";
import { apiFetch, apiErrorMessage } from "@/api/apiClient";

// export default function QuestionEditor({ notify }) {
// const [questions, setQuestions] = useState([]);
export default function QuestionEditor({
  notify,
  questions,
  refreshQuestions,
  question,
  onCancel,}) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();
  const lifecycleMutation = useQuestionLifecycle();
  const syncIrtMutation = useSyncQuestionIrt();

  // const notify = (msg, type = "info") => {
  // if (type === "success") toast.success(msg);
  //   else if (type === "error") toast.error(msg);
  //   else toast(msg);
  // };
  
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    type: null,
    subQuestionIds: [],
    passageId: null,
  });

  // For reading comprehension
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [linkedSubQuestions, setLinkedSubQuestions] = useState([]);

  // Manage linked preview and expansion
  const [expandedPreview, setExpandedPreview] = useState(false);

  const toggleLinkedPreview = () => setExpandedPreview((prev) => !prev);

  const getLinkedQuestionPreview = (ids = []) =>
    availableQuestions.filter((q) => ids.includes(q.id));

  // dropdown presets
  const subjects = ["Mathematics", "Science", "English", "Social Science"];
  const grades = [
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
  ];
  const bloomLevels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ];
  const soloLevels = [
    "Prestructural",
    "Unistructural",
    "Multistructural",
    "Relational",
    "Extended Abstract",
  ];
  const difficulties = ["easy", "medium", "hard"];
  const statuses = ["new", "review", "active", "retired"];
  const types = [
    "mcq",
    "msq",
    "open",
    "numeric",
    "equation",
    "image",
    "audio",
    "video",
    "reading",
    "data",
    "rubric",
    "ordering",
    "matching",
  ];

  // AIG presets
  const AIG_TEMPLATES = [
    {
      id: "matrix_1x4_rotation_v1",
      label: "Matrix Reasoning (1×4)",
      description: "1×4 Raven-style matrix with rotation + shape rules",
    },
    {
      id: "matrix_2x3_rotation_v1",
      label: "Matrix Reasoning (2×3)",
      description: "2×3 Raven-style matrix with rotation + shape rules",
    },
    {
      id: "matrix_3x3_rotation_v1",
      label: "Matrix Reasoning (3×3)",
      description: "3×3 Raven-style matrix with rotation + shape rules",
    },
  ];

  // use role from AuthProvider (sessionStorage-backed)
  const { auth } = useAuth?.() || {};
  const role =
    auth?.role ||
    (() => {
      try {
        const raw = sessionStorage.getItem("ecd_auth_v1");
        return raw ? JSON.parse(raw).role : "teacher";
      } catch {
        return "teacher";
      }
    })();

  const isAdmin = role === "admin";
  const isDistrict = role === "district";
  const isTeacher = role === "teacher";

  // load questions
  // useEffect(() => {
  //   fetch("/api/questions")
  //     .then((res) => res.json())
  //     .then((data) => setQuestions(data || []))
  //     .catch(() => setQuestions([]));
  // }, []);

  // Load all questions for linking sub-questions
  // useEffect(() => {
  //   fetch("/api/questions")
  //     .then((res) => res.json())
  //     .then((data) => setAvailableQuestions(data || []))
  //     .catch(() => setAvailableQuestions([]));
  // }, []);

  const blankQuestion = () => ({
    id: `q${Date.now()}`,
    type: "mcq",
    stem: "",
    options: [],
    correctOptionIds: [],
    media: {},
    metadata: {
      subject: "",
      grade: "",
      topic: "",
      tags: [],
      difficulty: "medium",
      bloomLevel: "",
      soloLevel: "",
      expectedAnswer: "",
      source: "",
      interactionType: "",
      dataSchema: {},
      aig: {
        enabled: false,
        templateId: null,
        variantIndex: null
      }
    },
    status: "new",
    creator: localStorage.getItem("userId") || "teacher_user",
    usageCount: 0,
    maxUsageBeforeRetire: 5,
    reactivationCount: 0,
    maxReactivations: 2,
    irtParams: { a: 1.0, b: 0.0, c: 0.2, updatedAt: null, source: "local" },
  });

  // ✅ Prepare Question for Save — schema-compliant, auto IDs + reading linkage
  function prepareQuestionForSave(q) {
    // Clone to avoid mutating React state directly
    const question = JSON.parse(JSON.stringify(q));

    // --- Helper for unique IDs ---
    const genId = (prefix = "id") =>
      `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // --- Ensure question has an ID ---
    if (!question.id || question.id.toString().trim() === "") {
      question.id = genId("q");
    }

    // --- Safe defaults ---
    question.status = ["new", "review", "active", "retired"].includes(question.status)
      ? question.status
      : "new";

    question.metadata ||= {};
    question.metadata.subject ||= "General";
    question.metadata.grade ||= "Class 6";
    question.metadata.topic ||= "Untitled";
    question.metadata.difficulty ||= "medium";

    // --- Type-specific handling ---
    switch (question.type) {
      case "mcq":
      case "msq": {
        question.options ||= [];

        // Assign unique IDs to all options
        question.options = question.options.map((opt) => ({
          id: opt.id || genId("opt"),
          text: opt.text || "Option",
          isCorrect: opt.isCorrect || false,
        }));

        // Ensure at least one valid option
        if (question.options.length === 0) {
          const newId = genId("opt");
          question.options.push({ id: newId, text: "Option 1", isCorrect: true });
        }

        // Sync correctOptionIds with valid option IDs
        const correctIds = question.options
          .filter((o) => o.isCorrect || question.correctOptionIds?.includes(o.id))
          .map((o) => o.id);

        question.correctOptionIds =
          correctIds.length > 0 ? correctIds : [question.options[0].id];
        break;
      }

      case "open":
      case "numeric":
        question.metadata.expectedAnswer ||= "To be provided";
        break;

      case "image":
        question.media ||= {};
        question.media.image ||= "placeholder.png";
        break;

      case "data":
        question.media ||= {};
        question.media.dataset ||= "data/sample.csv";
        break;

      case "reading":
        // Ensure reading passage has unique ID
        question.passageId = question.id;
        question.subQuestionIds ||= [];

        // If linked sub-questions exist, ensure they reference this passageId
        if (Array.isArray(question.subQuestionIds) && question.subQuestionIds.length > 0) {
          question.subQuestionIds = question.subQuestionIds.map((subId) =>
            subId.toString().trim()
          );
        }
        break;

      default:
        break;
    }

    // Prevents undefined states during save/edit.
    question.metadata.aig ||= {
      enabled: false,
      templateId: null,
      variantIndex: null
    };

    // --- Cleanup extraneous empty properties ---
    if (!question.media || Object.keys(question.media).length === 0) delete question.media;
    if (!question.options?.length) delete question.options;

    return question;
  }


  const handleSave = async (q) => {
    setLoading(true);

    // ✅ Normalize the question object for schema compliance
    const prepared = prepareQuestionForSave(q);

    try {
      // --- 1️⃣ Save the main question (parent or child) ---
      const saved = prepared._isNew
        ? await createQuestionMutation.mutateAsync(prepared)
        : await updateQuestionMutation.mutateAsync({ id: prepared.id, payload: prepared });

      // --- 2️⃣ If this is a reading passage, update all linked sub-questions ---
      if (prepared.type === "reading" && prepared.subQuestionIds?.length > 0) {
        for (const subId of prepared.subQuestionIds) {
          await updateQuestionMutation.mutateAsync({
            id: subId,
            payload: { passageId: saved.id },
          });
        }
        notify?.(`📚 Linked ${prepared.subQuestionIds.length} sub-questions to this passage`);
      }

      // 🔑 FORCE parent state to be authoritative
      refreshQuestions?.();

      notify?.("✅ Question saved successfully");

      // ✅ CLOSE THE EDITOR
      onCancel?.();

    } catch (err) {
      console.error(err);
      notify?.("❌ Failed to save question: " + apiErrorMessage(err, err.message));
    } finally {
      setLoading(false);
    }
    // after save
    // setQuestions((prev) =>
    //   prepared._isNew
    //     ? [...prev, saved]
    //     : prev.map((q) => (q.id === saved.id ? saved : q))
    // );

    setSelected(null);
  };

  // open delete confirmation modal (call this from delete buttons)
  const confirmDelete = (id, type = null, subQuestionIds = [], passageId = null) => {
    setDeleteModal({ open: true, id, type, subQuestionIds, passageId });
  };

  // perform actual deletion (called when modal confirmed)
  const performDelete = async () => {
    const { id, type, subQuestionIds, passageId } = deleteModal;
    if (!id) {
      setDeleteModal({ open: false, id: null, type: null, subQuestionIds: [], passageId: null });
      return;
    }

    try {
      // If this is a reading passage, unlink its sub-questions first
      if (type === "reading" && Array.isArray(subQuestionIds) && subQuestionIds.length > 0) {
        for (const subId of subQuestionIds) {
          await updateQuestionMutation.mutateAsync({
            id: subId,
            payload: { passageId: null },
          });
        }
        notify?.(`🔗 Unlinked ${subQuestionIds.length} sub-questions from passage ${id}`);
      }

      // If deleting a sub-question, remove it from parent passage.subQuestionIds
      if (type !== "reading" && passageId) {
        try {
          const parent = await apiFetch(`/api/questions/${passageId}`, {}, auth);
          if (parent?.type === "reading" && Array.isArray(parent.subQuestionIds)) {
            const updatedSubs = parent.subQuestionIds.filter((sid) => sid !== id);
            await updateQuestionMutation.mutateAsync({
              id: passageId,
              payload: { subQuestionIds: updatedSubs },
            });
            notify?.(`📘 Removed ${id} from passage ${passageId}`);
          }
        } catch {
          // Parent passage may already be gone -- non-fatal, continue with the delete.
        }
      }

      // finally delete the question
      await deleteQuestionMutation.mutateAsync(id);

      // 🔑 FORCE parent state to be authoritative
      refreshQuestions?.();

      notify?.("✅ Question deleted successfully");
    } catch (err) {
      console.error(err);
      notify?.("❌ Failed to delete question: " + apiErrorMessage(err, err.message));
    } finally {
      setDeleteModal({ open: false, id: null, type: null, subQuestionIds: [], passageId: null });
    }

    setSelected(null);
  };


  const updateField = (k, v) => setSelected({ ...selected, [k]: v });
  const updateMeta = (k, v) =>
    setSelected({ ...selected, metadata: { ...selected.metadata, [k]: v } });

  const addOption = () =>
    setSelected({
      ...selected,
      options: [
        ...(selected.options || []),
        { id: `opt${Date.now()}`, text: "", isCorrect: false },
      ],
    });

  const updateOption = (id, patch) => {
    const updated = selected.options.map((o) =>
      o.id === id ? { ...o, ...patch } : o
    );
    setSelected({ ...selected, options: updated });
  };

  const removeOption = (id) => {
    setSelected({
      ...selected,
      options: selected.options.filter((o) => o.id !== id),
    });
  };

  // const toggleCorrect = (id) => {
  //   const list = selected.correctOptionIds || [];
  //   const exists = list.includes(id);
  //   const newList = exists ? list.filter((x) => x !== id) : [...list, id];
  //   setSelected({ ...selected, correctOptionIds: newList });
  // };

  // Schema safe fix for the checkbox
  const toggleCorrect = (id) => {
    const updatedOptions = selected.options.map((o) => ({
      ...o,
      isCorrect: o.id === id ? !o.isCorrect : o.isCorrect,
    }));

    const correctOptionIds = updatedOptions
      .filter((o) => o.isCorrect)
      .map((o) => o.id);

    setSelected({
      ...selected,
      options: updatedOptions,
      correctOptionIds,
    });
  };

  // Admin lifecycle controls (review / activate / retire / reactivate) for
  // the currently selected question. This was previously called from the
  // Status section below but never defined, so every click threw
  // "handleLifecycle is not defined".
  const handleLifecycle = async (action) => {
    if (!selected?.id) return;

    try {
      const updated = await lifecycleMutation.mutateAsync({
        id: selected.id,
        action,
        userId: auth?.username || role,
        role,
      });
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
      notify?.(`✅ ${action} successful`);
      refreshQuestions?.();
    } catch (err) {
      console.error(err);
      notify?.(`❌ Failed to ${action}: ${apiErrorMessage(err, err.message)}`);
    }
  };


  const renderEditor = () => {
    if (!selected) return null;
    const q = selected;

    // AIG defaults
    const aig = q.metadata.aig || {
      enabled: false,
      templateId: null,
      variantIndex: null,
    };

    return (
      <div className="p-4 border rounded-md space-y-4 bg-gray-50 shadow-sm">
        <h3 className="text-lg font-semibold">
          {q._isNew ? "New Question" : `Editing: ${q.id}`}
        </h3>

        {/* Question Type */}
        <div>
          <label className="font-medium text-sm">Type</label>
          <select
            value={q.type}
            onChange={(e) => updateField("type", e.target.value)}
            className="w-full border p-2 rounded text-sm"
          >
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Stem */}
        <div>
          <label className="font-medium text-sm">Stem / Prompt</label>

          {/* 🧠 AIG Matrix Stimulus (only for matrix items) */}
          {q.metadata?.aig?.enabled &&
            q.parameters?.grid && (
              <div className="w-full overflow-x-auto py-2">
                <div className="inline-flex items-center justify-center">
                {renderAIGStem({
                  templateId: q.metadata.aig.templateId,
                  parameters: q.parameters,
                })}
                </div>
              </div>
            )}

          {/* ✏️ Stem text (always visible) */}
          <Textarea
            rows={3}
            value={q.stem}
            onChange={(e) => updateField("stem", e.target.value)}
          />
        </div>

        {/* 🔹 Reading comprehension passage editor */}
        {q.type === "reading" && (
          <div className="space-y-4 border p-3 rounded-md bg-white">
            <h4 className="font-semibold text-base flex items-center justify-between">
              🧾 Reading Passage
              <button
                type="button"
                onClick={toggleLinkedPreview}
                className="text-xs text-blue-600 underline"
              >
                {expandedPreview ? "Hide Linked Preview" : "Show Linked Preview"}
              </button>
            </h4>

            {/* Passage Text */}
            <Textarea
              rows={8}
              placeholder="Paste or write the reading passage here..."
              value={q.stem}
              onChange={(e) => updateField("stem", e.target.value)}
              className="w-full border p-2 rounded"
            />

            {/* Sub-question linking */}
            <div>
              <label className="font-medium text-sm">
                Link Sub-Questions (Ctrl/Cmd for multi-select)
              </label>
              <select
                multiple
                className="w-full border p-2 rounded text-sm"
                value={linkedSubQuestions}
                onChange={(e) =>
                  setLinkedSubQuestions(
                    Array.from(e.target.selectedOptions).map((o) => o.value)
                  )
                }
              >
                {availableQuestions
                  .filter(
                    (qq) =>
                      qq.id !== q.id &&
                      qq.type !== "reading" &&
                      !qq.passageId
                  )
                  .map((qq) => (
                    <option key={qq.id} value={qq.id}>
                      {qq.metadata?.topic || "(untitled)"} —{" "}
                      {qq.stem?.slice(0, 90) || qq.id}
                    </option>
                  ))}
              </select>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    updateField("subQuestionIds", linkedSubQuestions);
                    notify?.(
                      `📚 Linked ${linkedSubQuestions.length} sub-questions to passage`
                    );
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Update Linked
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLinkedSubQuestions([]);
                    updateField("subQuestionIds", []);
                  }}
                  className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                >
                  Clear Links
                </button>
              </div>
            </div>

            {/* Linked Sub-question preview */}
            {expandedPreview && q.subQuestionIds?.length > 0 && (
              <div className="mt-3 border-t pt-2 space-y-1">
                <h5 className="font-semibold text-sm text-gray-700 mb-2">
                  Linked Questions ({q.subQuestionIds.length})
                </h5>
                {getLinkedQuestionPreview(q.subQuestionIds).map((qq) => (
                  <Card
                    key={qq.id}
                    className="p-2 flex justify-between items-center border-l-4 border-blue-400"
                  >
                    <div className="text-sm text-gray-700 truncate">
                      ↳ {qq.stem?.slice(0, 100) || "(no text)"}
                      <span className="ml-2 text-xs text-gray-500">
                        [{qq.type}]
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected({ ...qq, _isNew: false })}
                      className="text-blue-600 underline text-xs"
                    >
                      Edit
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Options for MCQ/MSQ */}
        {["mcq", "msq"].includes(q.type) && (
          <div className="space-y-2">
            <h4 className="font-medium">Options</h4>
            {(q.options || []).map((opt) => (
              <div
                key={opt.id}
                className="flex items-center space-x-2 border p-2 rounded bg-white"
              >
                <Checkbox
                  checked={q.correctOptionIds?.includes(opt.id)}
                  onCheckedChange={() => toggleCorrect(opt.id)}
                />
                {/* <Input
                  value={opt.text}
                  onChange={(e) =>
                    updateOption(opt.id, { text: e.target.value })
                  }
                  placeholder="Option text"
                  className="flex-1"
                /> */}
                <div className="flex items-center gap-2">
                  {q.metadata?.aig?.enabled &&
                    q.metadata.aig.templateId && (
                      <div className="border rounded p-1 bg-gray-50">
                        {renderAIGOption({
                          option: opt,
                        })}
                      </div>
                    )}

                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      updateOption(opt.id, { text: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={addOption}
            >
              Add Option
            </button>
          </div>
        )}

        {/* Media */}
        {["image", "audio", "video", "data"].includes(q.type) && (
          <div className="space-y-2">
            <h4 className="font-medium">Media Attachments</h4>
            <div className="grid grid-cols-2 gap-2">
              {q.type === "image" && (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    updateField("media", {
                      ...q.media,
                      image: e.target.files[0]?.name,
                    })
                  }
                />
              )}
              {q.type === "audio" && (
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    updateField("media", {
                      ...q.media,
                      audio: e.target.files[0]?.name,
                    })
                  }
                />
              )}
              {q.type === "video" && (
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    updateField("media", {
                      ...q.media,
                      video: e.target.files[0]?.name,
                    })
                  }
                />
              )}
              {q.type === "data" && (
                <Input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) =>
                    updateField("media", {
                      ...q.media,
                      dataset: e.target.files[0]?.name,
                    })
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 border-t pt-3">
          <h4 className="font-medium">Metadata</h4>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Subject"
              value={q.metadata.subject}
              options={subjects}
              onChange={(v) => updateMeta("subject", v)}
            />
            <SelectField
              label="Grade"
              value={q.metadata.grade}
              options={grades}
              onChange={(v) => updateMeta("grade", v)}
            />
            <Input
              label="Expected Answer"
              value={q.metadata.expectedAnswer}
              placeholder="Expected Answer (optional)"
              onChange={(e) => updateMeta("expectedAnswer", e.target.value)}
            />
            {/* <Input
              label="Source"
              value={q.metadata.source}
              placeholder="Source (optional)"
              onChange={(e) => updateMeta("source", e.target.value)}
            />             */}
            <Input
              label="Topic"
              placeholder="Topic (optional)"
              value={q.metadata.topic}
              onChange={(e) => updateMeta("topic", e.target.value)}
            />
            <SelectField
              label="Interaction Type"
              value={q.metadata.interactionType}
              options={[
                "verbal",
                "non-verbal",
                "data",
                "performance",
              ]}
              onChange={(v) => updateMeta("interactionType", v)}
            />      
            <SelectField
              label="Difficulty"
              value={q.metadata.difficulty}
              options={difficulties}
              onChange={(v) => updateMeta("difficulty", v)}
            />
            <SelectField
              label="Bloom Level"
              value={q.metadata.bloomLevel}
              options={bloomLevels}
              onChange={(v) => updateMeta("bloomLevel", v)}
            />
            <SelectField
              label="SOLO Level"
              value={q.metadata.soloLevel}
              options={soloLevels}
              onChange={(v) => updateMeta("soloLevel", v)}
            />
          </div>
        </div>

      {/* 🧠 AIG Controls — Non-verbal only */}
      {q.metadata?.interactionType === "non-verbal" && (
        <div className="border-t pt-4 mt-4 space-y-3 bg-white p-3 rounded">
          <h4 className="font-semibold text-base">
            🧠 Automatic Item Generation (AIG)
          </h4>

          {/* Enable AIG */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={aig.enabled}
              onCheckedChange={(v) =>
                updateMeta("aig", {
                  ...aig,
                  enabled: !!v,
                })
              }
            />
            Enable AIG for this item
          </label>

          {/* Template selector */}
          {aig.enabled && (
            <>
              <div>
                <label className="font-medium text-sm">AIG Template</label>
                <select
                  value={aig.templateId || ""}
                  onChange={(e) =>
                    updateMeta("aig", {
                      ...aig,
                      templateId: e.target.value,
                    })
                  }
                  className="w-full border p-2 rounded text-sm"
                >
                  <option value="">-- select template --</option>
                  {AIG_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {q.metadata?.aig?.enabled &&
                q.metadata.interactionType === "non-verbal" && (
                  <div className="mt-1 text-xs text-amber-600">
                    Item difficulty emerges from rotation angle, symmetry, and direction.
                    Regenerate variants to obtain different difficulty levels.
                  </div>
              )}  

              {/* Generate variants */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!aig.templateId}
                  className="bg-purple-600 text-white px-3 py-1 rounded disabled:bg-gray-400"
                  onClick={async () => {
                    try {
                      notify?.("⏳ Generating AIG variants...");
                      const res = await fetch("/api/aig/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          templateId: aig.templateId,
                          count: 5,
                          difficulty: q.metadata.difficulty || "easy",
                        }),
                      });

                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "AIG failed");

                      notify?.(
                        `✅ Generated ${data.created} AIG questions`,
                        "success"
                      );

                      refreshQuestions?.();

                      // ✅ CLOSE THE EDITOR
                      onCancel?.();

                    } catch (err) {
                      console.error(err);
                      notify?.(`❌ AIG generation failed: ${err.message}`, "error");
                    }
                  }}
                >
                  Generate 5 variants
                </button>

                <span className="text-xs text-gray-500">
                  Variants will appear in the Item Bank
                </span>
              </div>
            </>
          )}
        </div>
      )}
              
        {/* --- Lifecycle / Creator / IRT (role guarded) --- */}
        {isAdmin ? (
            <>
              {/* Lifecycle Section */}          
              <div className="mt-4">
                <label className="font-medium text-sm">Status</label>
                <select
                  value={q.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full border p-2 rounded text-sm bg-white"
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <div className="text-xs text-gray-500 mt-1">
                  You can modify the question status
                </div>

                <div className="mt-2 space-x-2">
                  {q.status === "review" && (
                    <button
                      type="button"
                      onClick={() => handleLifecycle("activate")}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Mark Active
                    </button>
                  )}

                  {q.status === "active" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleLifecycle("review")}
                        className="bg-gray-600 text-white px-3 py-1 rounded"
                      >
                        Move to Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLifecycle("retire")}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Retire
                      </button>
                    </>
                  )}

                  {q.status === "retired" && (
                    <button
                      type="button"
                      onClick={() => handleLifecycle("activate")}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>

          {/* Creator / Modifier display — admin only */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 bg-gray-50 border p-2 rounded">
              <div>
                <strong>Creator:</strong> {q.creator || "—"}
              </div>
              <div>
                <strong>Modifier:</strong> {q.modifier || "—"}
              </div>
              <div>
                <strong>Usage Count:</strong> {q.usageCount || 0}
              </div>
              <div>
                <strong>Reactivations:</strong>{" "}
                {(q.reactivationCount || 0) + " / " + (q.maxReactivations || 2)}
              </div>
            </div>

        {/* 🔹 IRT Parameters section — visible only for Admin */}
            <div className="border-t pt-3 mt-3">
              <h4 className="font-medium">IRT Parameters (from R Backend)</h4>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <label>a (Discrimination)</label>
                  <Input
                    type="number"
                    value={q.irtParams?.a || ""}
                    onChange={(e) =>
                      updateField("irtParams", {
                        ...q.irtParams,
                        a: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label>b (Difficulty)</label>
                  <Input
                    type="number"
                    value={q.irtParams?.b || ""}
                    onChange={(e) =>
                      updateField("irtParams", {
                        ...q.irtParams,
                        b: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label>c (Guessing)</label>
                  <Input
                    type="number"
                    value={q.irtParams?.c || ""}
                    onChange={(e) =>
                      updateField("irtParams", {
                        ...q.irtParams,
                        c: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={async () => {
                      try {
                        notify?.("⏳ Syncing IRT parameters from R backend...");
                        const data = await syncIrtMutation.mutateAsync(q.id);
                        updateField("irtParams", data.irtParams);
                        notify?.("✅ Synced IRT parameters from R backend");
                      } catch (err) {
                        console.error("IRT sync error:", err);
                        notify?.("❌ IRT sync failed: " + apiErrorMessage(err, err.message));
                      }
                    }}
                  >
                    Sync from R
                  </button>
                </div>
              </div>

              {q.irtParams?.updatedAt && (
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(q.irtParams.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
        </>
      ) : (
        <>
          {/* District / Teacher: do NOT show status dropdown or IRT */}
          {/* Teacher: offer Send for Review for new questions (new → review) */}
          {/* {isTeacher && selected?.id && selected?.status === "new" && (
            <div className="mt-3">
              <button
                type="button"
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={async () => {
                  try {
                    notify?.("⏳ Sending for review...");
                    const res = await fetch(`/api/questions/${selected.id}/lifecycle`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "review", userId: auth?.username || "unknown", role }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.error || res.statusText);
                    notify?.("✅ Sent for review", "success");
                    // refresh list & selected
                    const updated = await fetch("/api/questions").then((r) => r.json());
                    setQuestions(updated || []);
                    // update selected to the returned question if available
                    if (body?.question) setSelected((s) => ({ ...s, ...body.question }));
                  } catch (err) {
                    console.error("Send for review failed:", err);
                    notify?.("❌ Send for review failed: " + (err.message || err), "error");
                  }
                }}
              >
                Send for Review
              </button>
            </div>
          )} */}

          {/* District: hint — lifecycle buttons are available in the list/dashboard UI */}
          {isDistrict && (
            <div className="text-sm text-gray-600 mt-3">
              Use the question list or dashboard to change lifecycle (approve / move to review).
            </div>
          )}
        </>
      )}
        {/* Save/Delete */}
        <div className="flex justify-end space-x-2 pt-3 border-t">
          <button
            type="button"
            className="px-3 py-1 bg-gray-500 text-white rounded"
            onClick={() => setSelected(null)}
          >
            Cancel
          </button>
          {!q._isNew && (
            <button
              type="button"
              className="px-3 py-1 bg-red-600 text-white rounded"
              onClick={() => confirmDelete(q.id, q.type, q.subQuestionIds, q.passageId)}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="px-3 py-1 bg-blue-600 text-white rounded"
            disabled={loading}
            onClick={() => handleSave(q)}
          >
            {loading ? "Saving..." : "Save Question"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* <h2 className="text-2xl font-bold">Item Bank</h2> */}

      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setSelected({ ...blankQuestion(), _isNew: true })}
      >
      Add Question
      </button>
      
      {!selected && (
        <>
          {questions.length === 0 && (
            <p className="text-gray-500 text-sm">No questions added yet.</p>
          )}
          <ul className="space-y-2">
            {questions.map((q) => (
              <li
                key={q.id}
                className="border p-3 rounded bg-white flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{q.stem}</div>
                  <div className="text-xs text-gray-500">
                    {q.type} | {q.metadata?.subject} | {q.metadata?.grade} |{" "}
                    <span className="font-semibold">{q.status}</span>
                  </div>
                </div>
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={() => setSelected({ ...q, _isNew: false })}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>

        </>
      )}

      {selected && renderEditor()}
      
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, type: null, subQuestionIds: [], passageId: null })}
        onConfirm={performDelete}
        title="Confirm Delete"
        message={
          deleteModal.type === "reading"
            ? `Delete passage ${deleteModal.id}? This will unlink ${deleteModal.subQuestionIds?.length || 0} sub-questions.`
            : `Delete question ${deleteModal.id}?`
        }
        confirmClass="bg-red-500 hover:bg-red-600 text-white"
      />

    </div>
  );
}

// helper: Select dropdown
function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="font-medium text-sm">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-2 rounded text-sm"
      >
        <option value="">-- select --</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
