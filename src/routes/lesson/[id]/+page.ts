import { error } from '@sveltejs/kit';
import { getLesson } from '$lib/lessons/lessons';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const lesson = getLesson(params.id);
	if (!lesson) throw error(404, 'Lesson not found');
	return { lesson };
};
