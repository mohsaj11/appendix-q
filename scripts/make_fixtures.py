"""Build small sample Appendix Q workbooks for the tests.

They copy only the Cover Sheet labels of the template, with made-up contractors and projects,
filled in the different ways reviewers tend to fill the form. Run: python3 scripts/make_fixtures.py
"""
import datetime, pathlib
import openpyxl

OUT = pathlib.Path(__file__).resolve().parent.parent / 'tests' / 'fixtures'

def template(title, package, partner, submission_date='', acceptance_date=None):
    wb = openpyxl.Workbook()
    hidden = wb.active; hidden.title = 'Sheet4'; hidden.sheet_state = 'hidden'
    wb.create_sheet('Title')['B3'] = 'Title'
    ws = wb.create_sheet('Cover Sheet')
    rows = {
        3: (title,), 4: (title,), 5: ('CRITERIA FOR PROGRAMME REVIEW, ASSURANCE & ACCEPTANCE',),
        8: (f'Package Name:  {package}', 'SI Onshore PMO Project Manager: '),
        9: (f'Enterprise Partner Name: {partner}', 'Contract Number / Procurement Order: '),
        10: ('Contract Reference: ',),
        11: ('Submission Reference: SUB-001', 'Date for Assurance & Review Checks:'),
        12: (f'Submission Date: {submission_date}', 'Date for Acceptance Checks:'),
        14: ('Outcome for Review & Assurance Checks', 'Select Outcome'),
        15: ('Assured and submitted for Integration – No Comments',),
        16: ('Assured and submitted for Integration– Address Comments',),
        17: ('Assured and not submitted for Integration - Address Comments - reasons given:',),
        18: ('Checklist / Questions / Comments attached', 'Yes / No'),
        20: ('Outcome for Acceptance / Non-acceptance Checks', 'Select Outcome'),
        21: ('Accepted – No Comments',), 22: ('Accepted – Address Comments',),
        23: ('Not Accepted - reasons given:',),
        24: ('Checklist / Questions / Comments attached', 'Yes / No'),
        26: ('Reason(s) for not accepting a programme (NEC4 Clause 31.3)', 'Select Outcome'),
        27: ("The Partner's plan which it shows are not practicable",),
        28: ('It does not show the information which this contract requires',),
        29: ("It does not represent the Partner's plans realistically",),
        30: ('It does not allow the Client and Others to start, carry out and complete their work as notified to the Enterprise Partner (Z Clause)',),
        31: ('It does not comply with the Scope  ',),
        32: ('Reviewed by: ',), 33: ('Checked by:',), 34: ('Approved by: ',),
        36: ('Comments: (Summarise key points below): ',),
        37: (1,), 38: (2,), 39: (3,), 40: (4,), 41: (5,),
        44: ('Reviewed by: ', 'Checked by: '),
    }
    for r, vals in rows.items():
        for i, v in enumerate(vals):
            ws.cell(r, 2 + i, v)
    if acceptance_date:
        ws['D12'] = acceptance_date
    return wb, ws

def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # 1. Outcome picked from the drop-down beside the header; date typed after the label.
    wb, ws = template('Project Alpha Programme - Contractor A', 'Project Alpha', 'Contractor A', '04/11/2026')
    ws['C20'] = 'Accepted – Address Comments'
    ws['C14'] = 'Assured and submitted for Integration – Address Comments'
    ws['C37'] = 'Update the TRA register before next submission'
    wb.save(OUT / 'accepted-dropdown.xlsx')

    # 2. "X" beside the option, reasons after the colon, NEC4 reasons ticked, real date cell.
    wb, ws = template('Project Beta Programme - Contractor B', 'Project Beta', 'Contractor B', '',
                      datetime.datetime(2026, 10, 15))
    ws['C23'] = 'X'
    ws['B23'] = 'Not Accepted - reasons given: Critical path is broken by open ends'
    ws['C28'] = 'X'
    ws['C31'] = 'X'
    ws['C37'] = '42 activities have no successor'
    ws['C38'] = 'Negative lag on 3 activities'
    ws['B32'] = 'Reviewed by: J. Planner'
    wb.save(OUT / 'not-accepted-marks.xlsx')

    # 3. Nothing filled in except the names: month must come from the file name.
    wb, ws = template('Project Gamma Programme - Contractor C', 'Project Gamma', 'Contractor C')
    wb.save(OUT / 'Appendix Q - Gamma - Sep 2026.xlsx')

if __name__ == '__main__':
    main()
