/**
 * @file databaseHealthService.ts
 * @description Rotina de verificação de saúde da base de dados e conectividade em nuvem do BookFlow.
 */

import { getSupabaseClient } from './supabaseClient';

export type HealthStatusType = 'healthy' | 'degraded' | 'offline' | 'checking';

export interface DatabaseHealthStatus {
  status: HealthStatusType;
  latencyMs: number;
  lastChecked: number;
  message: string;
  isCloudActive: boolean;
}

export const databaseHealthService = {
  /**
   * Executa uma verificação leve de conectividade e latência com o Supabase
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    const startTime = performance.now();
    const client = getSupabaseClient();

    if (!client) {
      return {
        status: 'offline',
        latencyMs: 0,
        lastChecked: Date.now(),
        message: 'Modo Local Ativo: Banco Supabase em modo fallback no dispositivo.',
        isCloudActive: false,
      };
    }

    try {
      // Cria uma promessa com timeout de 4.5 segundos para evitar travamento
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de conexão com o banco (> 4500ms)')), 4500)
      );

      const queryPromise = client
        .from('profiles')
        .select('id', { head: true, count: 'exact' });

      // Race contra o timeout
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const latencyMs = Math.round(performance.now() - startTime);

      if (result?.error) {
        // Se a tabela ainda não foi criada mas o cliente respondeu
        if (result.error.code === '42P01') {
          return {
            status: 'healthy',
            latencyMs,
            lastChecked: Date.now(),
            message: 'Supabase Conectado: Tabelas aguardando script inicial.',
            isCloudActive: true,
          };
        }

        return {
          status: 'degraded',
          latencyMs,
          lastChecked: Date.now(),
          message: `Conexão instável (${result.error.message || 'Erro de resposta'}).`,
          isCloudActive: true,
        };
      }

      if (latencyMs > 2000) {
        return {
          status: 'degraded',
          latencyMs,
          lastChecked: Date.now(),
          message: `Conexão ativa com latência elevada (${latencyMs}ms).`,
          isCloudActive: true,
        };
      }

      return {
        status: 'healthy',
        latencyMs,
        lastChecked: Date.now(),
        message: `Banco de dados 100% operacional (${latencyMs}ms).`,
        isCloudActive: true,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: 'offline',
        latencyMs,
        lastChecked: Date.now(),
        message: 'Falha temporária ao comunicar com o Supabase. Sincronização local mantida.',
        isCloudActive: false,
      };
    }
  },
};
