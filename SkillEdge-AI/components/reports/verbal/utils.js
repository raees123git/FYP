// Utility functions for Verbal Report

export const getScoreColor = (score) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-accent";
  return "text-destructive";
};

export const getScoreLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Improvement";
};

export const getReadinessColor = (readiness) => {
  const colors = {
    "excellent": "text-green-500 bg-green-500/10 border-green-500/30",
    "ready": "text-primary bg-primary/10 border-primary/30",
    "needs improvement": "text-accent bg-accent/10 border-accent/30",
    "not ready": "text-destructive bg-destructive/10 border-destructive/30"
  };
  return colors[readiness?.toLowerCase()] || colors["needs improvement"];
};

export const downloadReport = (reportData) => {
  if (!reportData) return;
  
  const reportContent = `
VERBAL COMMUNICATION REPORT
================================
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

OVERALL ASSESSMENT
------------------
Overall Score: ${reportData.overall_score}/100
Summary: ${reportData.summary}
Interview Readiness: ${reportData.interview_readiness}

PERFORMANCE METRICS
-------------------
1. Answer Correctness: ${reportData.metrics.answer_correctness.score}/100
   ${reportData.metrics.answer_correctness.description}

2. Concepts Understanding: ${reportData.metrics.concepts_understanding.score}/100
   ${reportData.metrics.concepts_understanding.description}
   Key Concepts: ${reportData.metrics.concepts_understanding.key_concepts.join(", ")}

3. Domain Knowledge: ${reportData.metrics.domain_knowledge.score}/100
   ${reportData.metrics.domain_knowledge.description}
   Strengths: ${reportData.metrics.domain_knowledge.strengths.join(", ")}

4. Response Structure: ${reportData.metrics.response_structure.score}/100
   ${reportData.metrics.response_structure.description}
   Logical Flow: ${reportData.metrics.response_structure.logical_flow}
   Completeness: ${reportData.metrics.response_structure.completeness}

5. Depth of Explanation: ${reportData.metrics.depth_of_explanation.score}/100
   ${reportData.metrics.depth_of_explanation.description}
   Technical Depth: ${reportData.metrics.depth_of_explanation.technical_depth}

6. Vocabulary Richness: ${reportData.metrics.vocabulary_richness.score}/100
   ${reportData.metrics.vocabulary_richness.description}
   Vocabulary Level: ${reportData.metrics.vocabulary_richness.vocabulary_level}

INDIVIDUAL ANSWER ANALYSIS
--------------------------
${reportData.individual_answers.map((answer) => `
Question ${answer.question_number}:
  Correctness: ${answer.correctness}/100
  Strengths: ${answer.strengths.join(", ")}
  Areas for Improvement: ${answer.improvements.join(", ")}
`).join("\n")}

RECOMMENDATIONS
---------------
${reportData.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join("\n")}

================================
End of Report
`;
  
  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `verbal-report-${new Date().getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};