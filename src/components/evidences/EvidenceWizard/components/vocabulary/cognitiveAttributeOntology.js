// Cognitive Attribute Ontology Library
// ------------------------------------------------------------
// Research‑grade ontology for Evidence‑Centered Design systems
// Supports: Cognitive diagnostics, adaptive testing, learning analytics
// Structure:
// Domain -> Category -> Attribute

export const cognitiveAttributeOntology = {

  version: "1.0",
  description: "Universal cognitive attribute ontology for school subjects aligned with Evidence‑Centered Design",

  domains: [

    // ============================================================
    // KNOWLEDGE REPRESENTATION
    // ============================================================

    {
      id: "KNOW",
      name: "Knowledge Representation",
      description: "Understanding concepts, structures, and relationships",

      categories: [

        {
          id: "conceptual_understanding",
          name: "Conceptual Understanding",

          attributes: [
            { id: "concept_identification", label: "Concept Identification", description: "Recognizing relevant concepts" },
            { id: "concept_differentiation", label: "Concept Differentiation", description: "Distinguishing between related concepts" },
            { id: "concept_integration", label: "Concept Integration", description: "Connecting multiple concepts" },
            { id: "concept_abstraction", label: "Concept Abstraction", description: "Identifying underlying abstract principles" },
            { id: "concept_generalization", label: "Concept Generalization", description: "Extending concepts to new contexts" },
            { id: "concept_boundary_recognition", label: "Concept Boundary Recognition", description: "Understanding limits of a concept" },
            { id: "concept_relationship_mapping", label: "Concept Relationship Mapping", description: "Identifying relationships between concepts" },
            { id: "schema_construction", label: "Schema Construction", description: "Building organized conceptual frameworks" }
          ]
        },

        {
          id: "representation_interpretation",
          name: "Representation Interpretation",

          attributes: [
            { id: "symbol_interpretation", label: "Symbol Interpretation", description: "Understanding symbolic notation" },
            { id: "graph_interpretation", label: "Graph Interpretation", description: "Interpreting graphical data" },
            { id: "diagram_interpretation", label: "Diagram Interpretation", description: "Understanding diagrams" },
            { id: "table_interpretation", label: "Table Interpretation", description: "Reading tabular data" },
            { id: "model_interpretation", label: "Model Interpretation", description: "Understanding models and simulations" },
            { id: "representation_comparison", label: "Representation Comparison", description: "Comparing different representations" },
            { id: "representation_evaluation", label: "Representation Evaluation", description: "Evaluating effectiveness of representations" },
            { id: "representation_selection", label: "Representation Selection", description: "Choosing appropriate representations" }
          ]
        },

        {
          id: "representation_transformation",
          name: "Representation Transformation",

          attributes: [
            { id: "symbolic_translation", label: "Symbolic Translation", description: "Converting expressions between symbolic forms" },
            { id: "graphical_translation", label: "Graphical Translation", description: "Converting data into graphs" },
            { id: "diagrammatic_translation", label: "Diagrammatic Translation", description: "Converting information into diagrams" },
            { id: "table_conversion", label: "Table Conversion", description: "Transforming data into tables" },
            { id: "multi_representation_coordination", label: "Multi Representation Coordination", description: "Using multiple representations together" },
            { id: "representation_simplification", label: "Representation Simplification", description: "Reducing complexity of representations" },
            { id: "representation_expansion", label: "Representation Expansion", description: "Expanding representation detail" },
            { id: "representation_synthesis", label: "Representation Synthesis", description: "Combining representations" }
          ]
        }
      ]
    },


    // ============================================================
    // PROCEDURAL FLUENCY
    // ============================================================

    {
      id: "PROC",
      name: "Procedural Fluency",
      description: "Accurate and efficient execution of procedures",

      categories: [

        {
          id: "algorithm_execution",
          name: "Algorithm Execution",

          attributes: [
            { id: "procedure_recall", label: "Procedure Recall", description: "Recalling known procedures" },
            { id: "procedure_initiation", label: "Procedure Initiation", description: "Starting correct procedures" },
            { id: "sequential_execution", label: "Sequential Execution", description: "Executing steps in correct order" },
            { id: "step_verification", label: "Step Verification", description: "Checking steps during procedures" },
            { id: "procedure_completion", label: "Procedure Completion", description: "Completing procedures accurately" },
            { id: "procedure_optimization", label: "Procedure Optimization", description: "Improving efficiency of procedures" },
            { id: "multi_step_coordination", label: "Multi Step Coordination", description: "Managing multi step procedures" },
            { id: "procedure_adaptation", label: "Procedure Adaptation", description: "Adjusting procedures for variations" }
          ]
        },

        {
          id: "symbol_manipulation",
          name: "Symbol Manipulation",

          attributes: [
            { id: "symbol_substitution", label: "Symbol Substitution" },
            { id: "expression_simplification", label: "Expression Simplification" },
            { id: "equation_transformation", label: "Equation Transformation" },
            { id: "identity_application", label: "Identity Application" },
            { id: "algebraic_rearrangement", label: "Algebraic Rearrangement" },
            { id: "symbol_expansion", label: "Symbol Expansion" },
            { id: "symbol_reduction", label: "Symbol Reduction" },
            { id: "formula_substitution", label: "Formula Substitution" }
          ]
        },

        {
          id: "technical_skill_execution",
          name: "Technical Skill Execution",

          attributes: [
            { id: "measurement_accuracy", label: "Measurement Accuracy" },
            { id: "graph_construction", label: "Graph Construction" },
            { id: "diagram_construction", label: "Diagram Construction" },
            { id: "data_recording", label: "Data Recording" },
            { id: "unit_conversion", label: "Unit Conversion" },
            { id: "instrument_use", label: "Instrument Use" },
            { id: "technical_drawing", label: "Technical Drawing" },
            { id: "computational_efficiency", label: "Computational Efficiency" }
          ]
        }
      ]
    },


    // ============================================================
    // STRATEGIC COMPETENCE
    // ============================================================

    {
      id: "STRAT",
      name: "Strategic Competence",
      description: "Selecting and coordinating problem solving strategies",

      categories: [

        {
          id: "strategy_selection",
          name: "Strategy Selection",

          attributes: [
            { id: "strategy_identification", label: "Strategy Identification" },
            { id: "strategy_comparison", label: "Strategy Comparison" },
            { id: "strategy_selection", label: "Strategy Selection" },
            { id: "strategy_justification", label: "Strategy Justification" },
            { id: "strategy_switching", label: "Strategy Switching" },
            { id: "strategy_evaluation", label: "Strategy Evaluation" },
            { id: "strategy_optimization", label: "Strategy Optimization" },
            { id: "strategy_transfer", label: "Strategy Transfer" }
          ]
        },

        {
          id: "planning",
          name: "Planning",

          attributes: [
            { id: "goal_identification", label: "Goal Identification" },
            { id: "solution_planning", label: "Solution Planning" },
            { id: "step_sequencing", label: "Step Sequencing" },
            { id: "resource_allocation", label: "Resource Allocation" },
            { id: "constraint_identification", label: "Constraint Identification" },
            { id: "task_structuring", label: "Task Structuring" },
            { id: "plan_monitoring", label: "Plan Monitoring" },
            { id: "plan_revision", label: "Plan Revision" }
          ]
        },

        {
          id: "model_construction",
          name: "Model Construction",

          attributes: [
            { id: "variable_identification", label: "Variable Identification" },
            { id: "relationship_modeling", label: "Relationship Modeling" },
            { id: "mathematical_modeling", label: "Mathematical Modeling" },
            { id: "scientific_modeling", label: "Scientific Modeling" },
            { id: "system_representation", label: "System Representation" },
            { id: "model_testing", label: "Model Testing" },
            { id: "model_revision", label: "Model Revision" },
            { id: "model_validation", label: "Model Validation" }
          ]
        }
      ]
    },


    // ============================================================
    // REASONING
    // ============================================================

    {
      id: "REASON",
      name: "Reasoning and Explanation",
      description: "Logical inference and explanation of ideas",

      categories: [

        {
          id: "logical_reasoning",
          name: "Logical Reasoning",

          attributes: [
            { id: "deductive_reasoning", label: "Deductive Reasoning" },
            { id: "inductive_reasoning", label: "Inductive Reasoning" },
            { id: "conditional_reasoning", label: "Conditional Reasoning" },
            { id: "quantitative_reasoning", label: "Quantitative Reasoning" },
            { id: "pattern_reasoning", label: "Pattern Reasoning" },
            { id: "structural_reasoning", label: "Structural Reasoning" },
            { id: "analogical_reasoning", label: "Analogical Reasoning" },
            { id: "probabilistic_reasoning", label: "Probabilistic Reasoning" }
          ]
        },

        {
          id: "argumentation",
          name: "Argumentation",

          attributes: [
            { id: "claim_construction", label: "Claim Construction" },
            { id: "evidence_identification", label: "Evidence Identification" },
            { id: "evidence_evaluation", label: "Evidence Evaluation" },
            { id: "argument_structuring", label: "Argument Structuring" },
            { id: "counterargument_recognition", label: "Counterargument Recognition" },
            { id: "argument_comparison", label: "Argument Comparison" },
            { id: "argument_refinement", label: "Argument Refinement" },
            { id: "argument_defense", label: "Argument Defense" }
          ]
        },

        {
          id: "explanation",
          name: "Explanation",

          attributes: [
            { id: "causal_explanation", label: "Causal Explanation" },
            { id: "mechanistic_explanation", label: "Mechanistic Explanation" },
            { id: "process_explanation", label: "Process Explanation" },
            { id: "conceptual_explanation", label: "Conceptual Explanation" },
            { id: "procedural_explanation", label: "Procedural Explanation" },
            { id: "explanation_refinement", label: "Explanation Refinement" },
            { id: "explanation_comparison", label: "Explanation Comparison" },
            { id: "explanation_generalization", label: "Explanation Generalization" }
          ]
        }
      ]
    },


    // ============================================================
    // PROBLEM SOLVING
    // ============================================================

    {
      id: "PROB",
      name: "Problem Solving",

      categories: [

        {
          id: "problem_representation",
          name: "Problem Representation",

          attributes: [
            { id: "problem_interpretation", label: "Problem Interpretation" },
            { id: "problem_structuring", label: "Problem Structuring" },
            { id: "variable_identification_problem", label: "Variable Identification" },
            { id: "constraint_identification_problem", label: "Constraint Identification" },
            { id: "goal_definition", label: "Goal Definition" },
            { id: "problem_simplification", label: "Problem Simplification" },
            { id: "problem_reformulation", label: "Problem Reformulation" },
            { id: "problem_modeling", label: "Problem Modeling" }
          ]
        },

        {
          id: "solution_generation",
          name: "Solution Generation",

          attributes: [
            { id: "hypothesis_generation", label: "Hypothesis Generation" },
            { id: "hypothesis_testing", label: "Hypothesis Testing" },
            { id: "solution_generation", label: "Solution Generation" },
            { id: "alternative_solution_exploration", label: "Alternative Solution Exploration" },
            { id: "solution_refinement", label: "Solution Refinement" },
            { id: "solution_verification", label: "Solution Verification" },
            { id: "solution_generalization", label: "Solution Generalization" },
            { id: "solution_communication", label: "Solution Communication" }
          ]
        }
      ]
    },


    // ============================================================
    // METACOGNITION
    // ============================================================

    {
      id: "META",
      name: "Metacognition",

      categories: [

        {
          id: "cognitive_monitoring",
          name: "Cognitive Monitoring",

          attributes: [
            { id: "self_monitoring", label: "Self Monitoring" },
            { id: "progress_tracking", label: "Progress Tracking" },
            { id: "error_detection", label: "Error Detection" },
            { id: "strategy_awareness", label: "Strategy Awareness" }
          ]
        },

        {
          id: "cognitive_regulation",
          name: "Cognitive Regulation",

          attributes: [
            { id: "strategy_adjustment", label: "Strategy Adjustment" },
            { id: "error_correction", label: "Error Correction" },
            { id: "task_replanning", label: "Task Replanning" },
            { id: "reflection_on_learning", label: "Reflection on Learning" }
          ]
        }
      ]
    }

  ]

};


// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

export function findAttributeById(id) {

  for (const domain of cognitiveAttributeOntology.domains) {

    for (const category of domain.categories) {

      const attribute = category.attributes.find(a => a.id === id);

      if (attribute) {
        return {
          ...attribute,
          category: category.name,
          domain: domain.name
        };
      }

    }

  }

  return null;
}


export function listAllAttributes() {

  const attributes = [];

  cognitiveAttributeOntology.domains.forEach(domain => {

    domain.categories.forEach(category => {

      category.attributes.forEach(attribute => {

        attributes.push({
          ...attribute,
          category: category.name,
          domain: domain.name
        });

      });

    });

  });

  return attributes;
}
