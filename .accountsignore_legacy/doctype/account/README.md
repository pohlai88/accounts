# DOC-001: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

Account DocType represents an Accounting Ledger or Group.

Follows a composite model. `parent_account` represents the parent of an Account except a root
account. There can be only 4 root accounts: Income, Expense, Assets and Liabilities in a company.

Other features:

- It can be of type Debit or Credit.
- A Group is a collection of groups or ledgers
