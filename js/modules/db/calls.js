// db/calls.js — Call & Settings operations
import { supabaseClient } from '../supabase-init.js';
import { Logger } from '../logger.js';

export async function saveCall(callData, effectiveId) {
  try {
    const { data, error } = await supabaseClient
      .from('calls')
      .insert([{
        user_id: effectiveId,
        phone_number: callData.phoneNumber,
        duration: callData.duration,
        status: callData.status,
        transcript: callData.transcript,
        created_at: callData.timestamp || new Date().toISOString(),
      }]);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    Logger.error('db.saveCall', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }
}

export async function getCalls(effectiveId, limit = 50) {
  try {
    const { data, error } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('user_id', effectiveId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    Logger.error('db.getCalls', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }
}

export async function getStats(effectiveId, startDate, endDate) {
  try {
    const { data, error } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('user_id', effectiveId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    if (error) throw error;

    const totalCalls = data.length;
    const totalDuration = data.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    const statuses = data.reduce((acc, call) => {
      acc[call.status] = (acc[call.status] || 0) + 1;
      return acc;
    }, {});

    return { success: true, stats: { totalCalls, totalDuration, avgDuration, statuses } };
  } catch (error) {
    Logger.error('db.getStats', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }
}

export async function saveSettings(effectiveId, settings) {
  try {
    const { data, error } = await supabaseClient
      .from('user_settings')
      .upsert([{
        user_id: effectiveId,
        settings,
        updated_at: new Date().toISOString(),
      }]);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    Logger.error('db.saveSettings', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }
}

export async function getSettings(effectiveId) {
  try {
    const { data, error } = await supabaseClient
      .from('user_settings')
      .select('settings')
      .eq('user_id', effectiveId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data: data?.settings || {} };
  } catch (error) {
    Logger.error('db.getSettings', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }
}
