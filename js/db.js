// Database Helper Functions — Facade
// Combines db module objects (set on window by js/db/*.js) into single clanaDB object
// clanaUtils is now provided by js/modules/core.js — no duplicate here

const db = Object.assign({},
  typeof window.dbCalls !== 'undefined' ? window.dbCalls : {},
  typeof window.dbAssistants !== 'undefined' ? window.dbAssistants : {},
  typeof window.dbProfiles !== 'undefined' ? window.dbProfiles : {},
  typeof window.dbLeads !== 'undefined' ? window.dbLeads : {},
  typeof window.dbMessaging !== 'undefined' ? window.dbMessaging : {},
  typeof window.dbCustomers !== 'undefined' ? window.dbCustomers : {},
  typeof window.dbTools !== 'undefined' ? window.dbTools : {}
);

window.clanaDB = db;
