import type { APIRoute } from 'astro'
import { listSubmissions, updateSubmission, type SubmissionRecord } from '@/lib/frappe/client'
import { ok, fail } from '@/lib/frappe/guard'

export const prerender = false

const DEMO_SUBMISSIONS: SubmissionRecord[] = [
  {
    name: 'WEB-a89c3104e76d91f28b4931a293817101',
    kind: 'consultation',
    status: 'New',
    full_name: 'Herschel Fernando',
    email: 'h.fernando@ceylonlogistics.lk',
    phone: '+94 77 482 9102',
    organization: 'Ceylon Logistics & Freight (Pvt) Ltd',
    industry: 'Logistics & Supply Chain',
    employees: '51–200',
    interest: 'Frappe / ERPNext Implementation',
    message: 'We are currently running an old Sage 300 setup that struggles with warehouse inventory and multi-currency billing for port clearance. Looking to evaluate Frappe ERP for 85 concurrent users across Colombo and Hambantota hubs.',
    follow_up_notes: '',
    lead_doctype: 'Lead',
    lead: 'LEAD-2026-00412',
    page: '/contact',
    creation: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    modified: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    name: 'WEB-39b81ca0391f7c819d92138129a03982',
    kind: 'contact',
    status: 'In Progress',
    full_name: 'Anuki Jayawardena',
    email: 'anuki@apparelcraft.com',
    phone: '+94 71 889 1234',
    organization: 'ApparelCraft Export Garments',
    industry: 'Manufacturing',
    employees: '201–500',
    interest: 'Custom Frappe App Development',
    message: 'Need a custom barcode scanning and QC audit module integrated into ERPNext for cutting-table tracking. The team is already using Frappe HR and Payroll.',
    follow_up_notes: 'Spoke with Anuki today. Scheduled a technical discovery call for Thursday at 2:30 PM with Shakthi.',
    lead_doctype: 'Lead',
    lead: 'LEAD-2026-00388',
    page: '/contact',
    creation: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    modified: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    name: 'WEB-f92a1084b28192a0198273812839a038',
    kind: 'assessment',
    status: 'New',
    full_name: 'Dilan Perera',
    email: 'dilan@lankaretailholdings.com',
    phone: '+94 70 712 3456',
    organization: 'Lanka Retail Holdings',
    score: 82,
    band: 'Ready now',
    interest: 'ERP Readiness Assessment',
    message: 'Completed ERP Readiness Assessment online. Score: 82/100 (Ready now). Primary needs: POS multi-store sync and automated supplier replenishment.',
    follow_up_notes: '',
    lead_doctype: 'Lead',
    lead: 'LEAD-2026-00375',
    page: '/assessment',
    creation: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    modified: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    name: 'WEB-41a982b018391746281938a90184b819',
    kind: 'ticket',
    status: 'Closed',
    full_name: 'Kavindu Senanayake',
    email: 'kavindu@synapse.lk',
    phone: '+94 77 918 2736',
    organization: 'Synapse Tech Solutions',
    subject: 'SSL Certificate Renewal for custom domain in ERPNext',
    description: 'Our customer portal domain portal.synapse.lk had an expired Let\'s Encrypt certificate. Requesting an expedited certbot reload on the production bench.',
    priority: 'High',
    category: 'Infrastructure',
    helpdesk_ticket: 'HD-TICK-00219',
    follow_up_notes: 'Certbot renewed and nginx reloaded on the bench. Confirmed resolved by client.',
    lead_doctype: 'Lead',
    lead: 'LEAD-2026-00104',
    page: '/support',
    creation: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    modified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

export const GET: APIRoute = async () => {
  try {
    const res = await listSubmissions(50)
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      return ok({ submissions: res.data, live: true })
    }
  } catch {
    // Graceful fallback to demo data if Frappe server is offline
  }

  return ok({
    submissions: DEMO_SUBMISSIONS,
    live: false,
    notice: 'Displaying demo records (Frappe server currently unreachable from local environment)',
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { name, status, follow_up_notes } = body

    if (!name) return fail('Submission name is required', 400)

    const res = await updateSubmission(name, status, follow_up_notes)
    if (res.ok) {
      return ok(res.data)
    }
    return ok({ name, status, follow_up_notes, mockUpdated: true })
  } catch {
    return fail('Could not update submission', 500)
  }
}
