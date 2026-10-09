'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  NotificationEventType,
  NotificationChannel,
  NotificationAutomationRule,
} from '@washora/shared';
import { notificationSettingsApi } from '@/lib/api/notification-settings';

interface EventCategoryGroup {
  category: string;
  description: string;
  events: {
    eventType: NotificationEventType;
    label: string;
    description: string;
    recommended: boolean;
  }[];
}

const EVENT_GROUPS: EventCategoryGroup[] = [
  {
    category: 'Order Lifecycle Events',
    description: 'Triggered during order placement, stage transitions, and completion.',
    events: [
      {
        eventType: NotificationEventType.ORDER_CREATED,
        label: 'Order Created',
        description: 'Send receipt & order confirmation when clothes are received at the counter.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.ORDER_CONFIRMED,
        label: 'Order Confirmed',
        description: 'Notify customer when their order is accepted into the plant schedule.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.ORDER_READY,
        label: 'Order Ready For Pickup/Delivery',
        description: 'Alert customer immediately when garments pass QC and are packaged.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.ORDER_CANCELLED,
        label: 'Order Cancelled',
        description: 'Send cancellation confirmation and reason to the customer.',
        recommended: true,
      },
    ],
  },
  {
    category: 'Pickup Logistics Events',
    description: 'Doorstep pickup notifications for home collection appointments.',
    events: [
      {
        eventType: NotificationEventType.PICKUP_SCHEDULED,
        label: 'Pickup Appointment Scheduled',
        description: 'Confirm pickup date and scheduled time slot.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.PICKUP_REMINDER,
        label: 'Pickup Morning Reminder',
        description: 'Send morning reminder on the day of scheduled pickup.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.PICKUP_OUT_FOR_PICKUP,
        label: 'Driver En Route For Pickup',
        description: 'Alert customer when driver starts trip to their address.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.PICKUP_COMPLETED,
        label: 'Pickup Successfully Completed',
        description: 'Confirm garments received by delivery driver.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.PICKUP_FAILED,
        label: 'Pickup Attempt Failed',
        description: 'Notify customer if address was inaccessible or customer unavailable.',
        recommended: true,
      },
    ],
  },
  {
    category: 'Delivery Logistics Events',
    description: 'Doorstep dropoff notifications and proof of delivery updates.',
    events: [
      {
        eventType: NotificationEventType.DELIVERY_SCHEDULED,
        label: 'Delivery Scheduled',
        description: 'Confirm dropoff date and scheduled time window.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.DELIVERY_REMINDER,
        label: 'Delivery Day Reminder',
        description: 'Send reminder on the morning of scheduled delivery.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.DELIVERY_OUT_FOR_DELIVERY,
        label: 'Driver Out For Delivery',
        description: 'Alert customer that driver is en route with their clean clothes.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.DELIVERY_COMPLETED,
        label: 'Delivery Completed',
        description: 'Send delivery confirmation and digital invoice access.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.DELIVERY_FAILED,
        label: 'Delivery Attempt Failed',
        description: 'Alert customer regarding failed delivery attempt.',
        recommended: true,
      },
    ],
  },
  {
    category: 'Payments & Invoicing',
    description: 'Receipts, due reminders, and digital invoice links.',
    events: [
      {
        eventType: NotificationEventType.PAYMENT_RECEIVED,
        label: 'Payment Receipt',
        description: 'Send automated payment confirmation with remaining balance due.',
        recommended: true,
      },
      {
        eventType: NotificationEventType.PAYMENT_DUE,
        label: 'Payment Balance Due Reminder',
        description: 'Remind customer about outstanding unpaid balances.',
        recommended: false,
      },
      {
        eventType: NotificationEventType.INVOICE_READY,
        label: 'Digital Invoice Ready',
        description: 'Send digital invoice link upon order completion.',
        recommended: true,
      },
    ],
  },
  {
    category: 'Internal Plant & Processing (Optional)',
    description: 'Granular processing stage updates. Disabled by default to avoid spamming customers.',
    events: [
      {
        eventType: NotificationEventType.PROCESSING_STARTED,
        label: 'Processing Started',
        description: 'Notify customer when clothes enter wash/dry plant line.',
        recommended: false,
      },
      {
        eventType: NotificationEventType.PROCESSING_STATUS_UPDATED,
        label: 'Processing Stage Update',
        description: 'Send message on intermediate steps (Washing, Ironing).',
        recommended: false,
      },
      {
        eventType: NotificationEventType.QC_COMPLETED,
        label: 'QC Inspection Completed',
        description: 'Notify customer when quality check is completed.',
        recommended: false,
      },
    ],
  },
];

export default function AutomationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rules, setRules] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadAutomation();
  }, []);

  const loadAutomation = async () => {
    try {
      setLoading(true);
      const res = await notificationSettingsApi.getAutomation();
      const data = (res as any)?.data || res;
      const ruleMap = new Map<string, boolean>();

      if (data?.rules && Array.isArray(data.rules)) {
        for (const r of data.rules) {
          ruleMap.set(`${r.eventType}_${r.channel}`, r.enabled);
        }
      }
      setRules(ruleMap);
    } catch (err) {
      console.error('Failed to load automation settings', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventType: NotificationEventType, channel: NotificationChannel = NotificationChannel.WHATSAPP) => {
    const key = `${eventType}_${channel}`;
    setRules((prev) => {
      const next = new Map(prev);
      const current = next.get(key) ?? true;
      next.set(key, !current);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMsg('');
      setErrorMsg('');

      const payloadRules: NotificationAutomationRule[] = [];
      for (const group of EVENT_GROUPS) {
        for (const ev of group.events) {
          const key = `${ev.eventType}_WHATSAPP`;
          const isEnabled = rules.get(key) ?? ev.recommended;
          payloadRules.push({
            eventType: ev.eventType,
            channel: NotificationChannel.WHATSAPP,
            enabled: isEnabled,
          });
        }
      }

      await notificationSettingsApi.updateAutomation(payloadRules);
      setSuccessMsg('Automation event settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save automation settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/notifications" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Communications
            </a>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-semibold text-slate-700">Automation Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="h-7 w-7 text-emerald-600" />
            Customer Notification Automation Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Toggle which business lifecycle events automatically trigger customer WhatsApp messages.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
          Save Automation Rules
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Loading automation settings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {EVENT_GROUPS.map((group) => (
            <div key={group.category} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">{group.category}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
              </div>

              <div className="divide-y divide-slate-100">
                {group.events.map((ev) => {
                  const key = `${ev.eventType}_WHATSAPP`;
                  const isEnabled = rules.get(key) ?? ev.recommended;

                  return (
                    <div key={ev.eventType} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{ev.label}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {ev.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{ev.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                          <Smartphone className="h-3 w-3" /> WhatsApp
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleEvent(ev.eventType)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
