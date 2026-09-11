import content from '../../downloads/firelight.json?raw';
import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response(content, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
