import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function relDate(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const DEMO_TASKS = [
  {
    title: "Implement infinite zoom and pan canvas rendering",
    description: "Build smooth 60fps canvas transformation matrix with mouse wheel and pinch-to-zoom support. Ensure coordinates properly project from screen-space to world-space.",
    statusName: "In Progress",
    priority: "URGENT" as const,
    startDays: -4,
    dueDays: 0, // Due today!
    estimateMinutes: 480,
    spentMinutes: 320,
    completed: false,
  },
  {
    title: "Real-time multiplayer cursor synchronization",
    description: "Broadcast cursor position over WebSockets with 30ms throttling and interpolation so collaborators see smooth pointer movements with custom user labels.",
    statusName: "In Progress",
    priority: "HIGH" as const,
    startDays: -2,
    dueDays: 1, // Due tomorrow
    estimateMinutes: 360,
    spentMinutes: 180,
    completed: false,
  },
  {
    title: "Sticky notes with rich text editing & markdown",
    description: "Allow users to drop sticky notes anywhere on the board with color presets (yellow, pink, mint, blue) and autogrow text editing.",
    statusName: "In Review",
    priority: "HIGH" as const,
    startDays: -5,
    dueDays: -1, // 1 day overdue for urgency indicator
    estimateMinutes: 300,
    spentMinutes: 300,
    completed: false,
  },
  {
    title: "Vector shape tools (Rectangle, Ellipse, Arrow, Freehand)",
    description: "Implement vector drawing primitives with bounding box resize handles and rotation anchors. Store shapes as SVG paths in the database.",
    statusName: "To Do",
    priority: "MEDIUM" as const,
    startDays: 1,
    dueDays: 4,
    estimateMinutes: 420,
    spentMinutes: 0,
    completed: false,
  },
  {
    title: "Export whiteboard to high-resolution PNG & PDF",
    description: "Render the active bounding box of all canvas elements to offscreen canvas and export vector PDF / raster PNG at 2x resolution.",
    statusName: "To Do",
    priority: "MEDIUM" as const,
    startDays: 2,
    dueDays: 6,
    estimateMinutes: 240,
    spentMinutes: 0,
    completed: false,
  },
  {
    title: "WebRTC peer-to-peer audio/video calling overlay",
    description: "Floating mini video tiles on the top right corner of the canvas with mute/unmute and screen sharing toggles.",
    statusName: "In Progress",
    priority: "HIGH" as const,
    startDays: -1,
    dueDays: 3,
    estimateMinutes: 600,
    spentMinutes: 210,
    completed: false,
  },
  {
    title: "End-to-end room encryption for private boards",
    description: "Client-side AES-GCM room key derivation using Web Crypto API. Server only relays encrypted blobs without seeing canvas data.",
    statusName: "Backlog",
    priority: "HIGH" as const,
    startDays: null,
    dueDays: 12,
    estimateMinutes: 540,
    spentMinutes: 0,
    completed: false,
  },
  {
    title: "Undo/Redo history stack with state diffing",
    description: "Implement reversible command pattern stack for canvas actions (move, delete, draw, style change) with Ctrl+Z / Ctrl+Y shortcuts.",
    statusName: "Done",
    priority: "HIGH" as const,
    startDays: -8,
    dueDays: -3,
    estimateMinutes: 360,
    spentMinutes: 360,
    completed: true,
  },
  {
    title: "Template picker (Retrospective, User Journey, Brainstorm)",
    description: "Modal gallery with pre-built board layouts to kickstart workshops with one click.",
    statusName: "Done",
    priority: "MEDIUM" as const,
    startDays: -10,
    dueDays: -5,
    estimateMinutes: 240,
    spentMinutes: 240,
    completed: true,
  },
  {
    title: "Apple Pencil & stylus pressure sensitivity support",
    description: "Support PointerEvents pressure API to vary brush stroke width dynamically when drawing with drawing tablets or iPad stylus.",
    statusName: "Backlog",
    priority: "LOW" as const,
    startDays: null,
    dueDays: 18,
    estimateMinutes: 300,
    spentMinutes: 0,
    completed: false,
  },
  {
    title: "Collaborator permissions (Viewer, Commenter, Editor)",
    description: "Invite link modal with role selection and revocable access tokens.",
    statusName: "To Do",
    priority: "URGENT" as const,
    startDays: 0,
    dueDays: 2,
    estimateMinutes: 300,
    spentMinutes: 60,
    completed: false,
  },
  {
    title: "Dark mode theme toggle for whiteboard canvas",
    description: "Invert canvas background to warm-dark (#17130f) with contrast-adapted grid lines and neon shape accents.",
    statusName: "Done",
    priority: "LOW" as const,
    startDays: -6,
    dueDays: -2,
    estimateMinutes: 180,
    spentMinutes: 150,
    completed: true,
  },
];

async function main() {
  // Find project "Visual white board pro"
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { key: "VWBP" },
        { name: { contains: "white", mode: "insensitive" } },
      ],
    },
    include: {
      statuses: true,
      workspace: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!project) {
    console.error("Project 'Visual white board pro' not found in database.");
    process.exit(1);
  }

  const userId = project.workspace.members[0]?.userId;
  console.log(`Found project: "${project.name}" (ID: ${project.id}, Key: ${project.key})`);
  console.log(`Assigning tasks to User ID: ${userId}`);

  const statusMap = new Map(
    project.statuses.map((s) => [s.name.toLowerCase().trim(), s]),
  );

  let currentNumber = project.taskCounter;

  for (const taskDef of DEMO_TASKS) {
    currentNumber += 1;
    const status =
      statusMap.get(taskDef.statusName.toLowerCase().trim()) ||
      project.statuses[0];

    const position = currentNumber * 1000;

    await prisma.task.create({
      data: {
        projectId: project.id,
        number: currentNumber,
        statusId: status.id,
        title: taskDef.title,
        description: taskDef.description,
        priority: taskDef.priority,
        position,
        creatorId: userId,
        assigneeId: userId,
        startDate: taskDef.startDays !== null ? relDate(taskDef.startDays) : null,
        dueDate: taskDef.dueDays !== null ? relDate(taskDef.dueDays) : null,
        completedAt: taskDef.completed ? relDate(taskDef.dueDays ?? -1) : null,
        estimateMinutes: taskDef.estimateMinutes,
        spentMinutes: taskDef.spentMinutes,
      },
    });

    console.log(`  + [${project.key}-${currentNumber}] ${taskDef.title} -> ${status.name}`);
  }

  await prisma.project.update({
    where: { id: project.id },
    data: { taskCounter: currentNumber },
  });

  console.log(`\nSuccessfully seeded ${DEMO_TASKS.length} tasks into "${project.name}"!`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
