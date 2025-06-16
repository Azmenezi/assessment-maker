import { create } from "zustand";

const localStorageKey = "pentest_templates";

const useTemplatesStore = create((set, get) => ({
  executiveSummary:
    JSON.parse(localStorage.getItem(localStorageKey))?.executiveSummary ||
    "Azure protection list...",
  scope:
    JSON.parse(localStorage.getItem(localStorageKey))?.scope ||
    "This report holds the detailed finding(s) Critical findings.\nScope\nThe assessment was based on scope as defined in the Security Assessment Plan (SAP). White Box Penetration Testing.",
  methodology:
    JSON.parse(localStorage.getItem(localStorageKey))?.methodology ||
    "An internal penetration test is a dedicated attack against internally connected systems. The focus of this test is to perform attacks, like those of a hacker and attempt to infiltrate {PROJECT_NAME} systems. Overall objective was to evaluate the system and exploit flaws while reporting the findings back for mitigation.\nOWASP Top 10 vulnerability attacks will be in scope:\nA01:2021-Broken Access Control\nA02:2021-Cryptographic\nA03:2021-Injection\nA04:2021-Insecure Design\nA05:2021-Security Misconfiguration\nA06:2021-Vulnerable and Outdated Components A07:2021-Identification and Authentication Failures\nA08:2021-Software and Data Integrity Failures\nA09:2021-Security Logging and Monitoring Failures\nA10:2021-Server-Side Request Forgery\nPenetration testing take on consideration system is complied with PCI-DSS and ISO 27001.",
  assessorName:
    JSON.parse(localStorage.getItem(localStorageKey))?.assessorName ||
    "Assessor Name",
  setAssessorName: (val) => {
    set({ assessorName: val });
    saveToLocalStorage(get());
  },
  setExecutiveSummary: (val) => {
    set({ executiveSummary: val });
    saveToLocalStorage(get());
  },
  setScope: (val) => {
    set({ scope: val });
    saveToLocalStorage(get());
  },
  setMethodology: (val) => {
    set({ methodology: val });
    saveToLocalStorage(get());
  },
}));

function saveToLocalStorage(state) {
  localStorage.setItem(
    "pentest_templates",
    JSON.stringify({
      executiveSummary: state.executiveSummary,
      scope: state.scope,
      methodology: state.methodology,
      assessorName: state.assessorName,
    })
  );
}

export default useTemplatesStore;
