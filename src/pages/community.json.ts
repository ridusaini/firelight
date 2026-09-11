import type { APIRoute } from 'astro';
import { getCommunity } from '../lib/community';
export const GET: APIRoute = () => new Response(JSON.stringify(getCommunity(), null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
