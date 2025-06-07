const express = require('express');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './fitness.db'
  },
  useNullAsDefault: true
});

const app = express();
app.use(cors());
app.use(express.json());

// Създаваме таблици, ако не съществуват
db.schema.hasTable('workouts').then(exists => {
  if (!exists) {
    return db.schema.createTable('workouts', table => {
      table.increments('id').primary();
      table.date('date');
      table.string('workout_type');
      table.integer('duration_minutes');
    });
  }
});

db.schema.hasTable('exercises').then(exists => {
  if (!exists) {
    return db.schema.createTable('exercises', table => {
      table.increments('id').primary();
      table.string('name');
      table.integer('reps');
      table.integer('sets');
      table.integer('workout_id').references('id').inTable('workouts');
    });
  }
});

// Добавяне на тренировка
app.post('/workouts', async (req, res) => {
  try {
    const { date, workout_type, duration_minutes } = req.body;
    const [id] = await db('workouts').insert({ date, workout_type, duration_minutes });
    res.json({ message: 'Workout added', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавяне на упражнение
app.post('/workouts/:id/exercises', async (req, res) => {
  try {
    const workout_id = req.params.id;
    const { name, reps, sets } = req.body;
    await db('exercises').insert({ name, reps, sets, workout_id });
    res.json({ message: 'Exercise added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Вземане на всички тренировки с упражненията им
app.get('/workouts', async (req, res) => {
  try {
    const workouts = await db('workouts');
    for (const workout of workouts) {
      workout.exercises = await db('exercises').where('workout_id', workout.id);
    }
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/**
 * Редактиране на упражнение
 */
app.put('/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, reps, sets, weight } = req.body;
    await db('exercises')
      .where({ id })
      .update({ name, reps, sets, weight });
    res.json({ message: 'Exercise updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавяне на колонка "weight" към exercises, ако не съществува
db.schema.hasColumn('exercises', 'weight').then(exists => {
  if (!exists) {
    return db.schema.table('exercises', table => {
      table.float('weight');
    });
  }
});