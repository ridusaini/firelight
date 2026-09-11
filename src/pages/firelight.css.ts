import content from '../../downloads/firelight.css?raw';
import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response(content, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
