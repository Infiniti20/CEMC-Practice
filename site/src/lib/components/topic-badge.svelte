<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		topics?: {
			primaryTopics: number[];
			secondaryTopics: number[];
		};
	}
	let { topics }: Props = $props();
	let fullTopicsArray: number[] = $derived.by(() => {
		if (topics) {
			return [...topics.primaryTopics, ...topics.secondaryTopics];
		}
		return [];
	});

	const topicColors = {
		Addition: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		Subtraction: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		Multiplication: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		Division: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		Exponents: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
		Percentages: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
		'Order of Operations': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
	};

	const legend = {
		'1': 'Algebra and Equations',
		'2': 'Angles',
		'3': 'Area',
		'4': 'Averages',
		'5': 'Circles',
		'6': 'Coordinate Geometry',
		'7': 'Counting',
		'8': 'Counting and Probability',
		'9': 'Cylinders',
		'10': 'Data Analysis',
		'11': 'Decimals',
		'12': 'Digits',
		'13': 'Divisibility',
		'14': 'Equations Solving',
		'15': 'Equations of Lines',
		'16': 'Estimation',
		'17': 'Exponents',
		'18': 'Expressions',
		'19': 'Factoring',
		'20': 'Fractions/Ratios',
		'21': 'Games',
		'22': 'Geometry and Measurement',
		'23': 'Graphs',
		'24': 'Inequalities',
		'25': 'Logic',
		'26': 'Measurement',
		'27': 'Number Sense',
		'28': 'Operations',
		'29': 'Optimization',
		'30': 'Other',
		'31': 'Patterning/Sequences/Series',
		'32': 'Percentages',
		'33': 'Perimeter',
		'34': 'Polygons',
		'35': 'Prime Numbers',
		'36': 'Prisms',
		'37': 'Probability',
		'38': 'Quadrilaterals',
		'39': 'Rates',
		'40': 'Spheres',
		'41': 'Surface Area',
		'42': 'Transformations',
		'43': 'Triangles',
		'44': 'Volume'
	};

	function generateColor(index: number) {
		const colorList = [
			'red',
			'orange',
			'amber',
			'yellow',
			'lime',
			'green',
			'emerald',
			'teal',
			'cyan',
			'sky',
			'blue',
			'indigo',
			'violet',
			'purple',
			'fuchsia',
			'pink',
			'rose'
		];
		if (index < 18) {
			return `bg-${colorList[index - 1]}-100 text-${colorList[index - 1]}-800`;
		} else if (index < 35) {
			return `bg-${colorList[index - 18]}-900 text-neutral-50`;
		}
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each fullTopicsArray as topic}
		<Badge
			class={`${generateColor(topic) || 'bg-gray-900 text-neutral-50 dark:bg-gray-700 dark:text-gray-300'} font-medium`}
			variant="secondary"
		>
			{legend[topic.toString()]}
		</Badge>
	{/each}
</div>
