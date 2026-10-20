frappe.ui.form.on('Website Submission TI', {
	refresh(frm) {
		if (frm.doc.lead && frm.doc.lead_doctype) {
			frm.add_custom_button(__('Open Lead'), () => {
				frappe.set_route('Form', frm.doc.lead_doctype, frm.doc.lead);
			}, __('CRM'));
		}
		if (frm.doc.helpdesk_ticket) {
			frm.add_custom_button(__('Open Ticket'), () => {
				frappe.set_route('Form', 'HD Ticket', frm.doc.helpdesk_ticket);
			}, __('Helpdesk'));
		}
	}
});
