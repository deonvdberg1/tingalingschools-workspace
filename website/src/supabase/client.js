import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not set. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Reusable data access layer (one-to-one replacement for base44.entities.*)
export const db = {
  contracts: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase
        .from('parent_contracts')
        .select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from('parent_contracts').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('parent_contracts').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('parent_contracts').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('parent_contracts').delete().eq('id', id);
      if (error) throw error;
    }
  },

  staff: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('staff_members').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from('staff_members').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_members').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_members').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('staff_members').delete().eq('id', id);
      if (error) throw error;
    }
  },

  leaveRequests: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('leave_requests').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters, order = '-created_at', limit = 20) => {
      let query = supabase.from('leave_requests').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('leave_requests').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('leave_requests').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  leaveBalances: {
    list: async (order = '-updated_at') => {
      const { data, error } = await supabase.from('staff_leave_balances').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('staff_leave_balances').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_leave_balances').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_leave_balances').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  purchaseRequests: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('purchase_requests').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('purchase_requests').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query.order('-created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('purchase_requests').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('purchase_requests').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  paySlips: {
    list: async (order = '-pay_date') => {
      const { data, error } = await supabase.from('pay_slips').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters, order = '-pay_date', limit = 12) => {
      let query = supabase.from('pay_slips').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('pay_slips').insert(values).select().single();
      if (error) throw error;
      return data;
    }
  },

  events: {
    list: async (order = '-start_date', limit = 300) => {
      const { data, error } = await supabase.from('school_events').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('school_events').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('school_events').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('school_events').delete().eq('id', id);
      if (error) throw error;
    }
  },

  eventTemplates: {
    list: async () => {
      const { data, error } = await supabase.from('event_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('event_templates').insert(values).select().single();
      if (error) throw error;
      return data;
    }
  },

  announcements: {
    list: async (order = '-created_at', limit = 50) => {
      const { data, error } = await supabase.from('staff_announcements').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('staff_announcements').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query.order('-created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_announcements').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_announcements').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('staff_announcements').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // File Storage
  upload: async ({ file, bucket = 'contract_pdfs', path = '' }) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return { file_url: publicUrl, file_path: filePath };
  },

  // Contact Form Submissions
  contactSubmissions: {
    create: async (values) => {
      const { data, error } = await supabase.from('contact_submissions').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    list: async () => {
      const { data, error } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  }
};
