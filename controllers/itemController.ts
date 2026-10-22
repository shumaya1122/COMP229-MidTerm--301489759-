// ============================================================================
// Item Controller — webapp Mid-Term Test (Week 7)
// ============================================================================
// Each exported function below is a TODO for you to implement.
// (Behavior unchanged from the JS starter — only the module system/types changed.)
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Item from '../models/Item.js';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

// GET /api/items — public, supports ?type=&category= filtering
export const listItems: AsyncHandler = async (req, res, next) => {
  try {
    const filter: Record<string, string> = {};
    if (req.query.type) filter.type = String(req.query.type);
    if (req.query.category) filter.category = String(req.query.category);

    const items = await Item.find(filter).sort('-createdAt');
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/items/mine — items owned by the signed-in user
export const listMyItems: AsyncHandler = async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort('-createdAt');
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id — single item by id
export const getItemById: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
};

// POST /api/items — create a new item owned by the signed-in user
export const createItem: AsyncHandler = async (req, res, next) => {
  try {
    const { title, description, type, category, location, date } = req.body || {};

    if (!title || !description || !type || !category || !location || !date) {
      return res.status(400).json({
        error: 'title, description, type, category, location and date are required',
      });
    }

    const item = await Item.create({
      ...req.body,
      owner: req.user._id,
    });

    return res.status(201).json(item);
  } catch (err) {
    const error = err as Error;
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    next(err);
  }
};

// PUT /api/items/:id — update an item owned by the signed-in user only
export const updateItem: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You are not the owner of this item' });
    }

    const allowed = ['title', 'description', 'type', 'category', 'location', 'date', 'status'];
    for (const field of allowed) {
      if (req.body?.[field] !== undefined) {
        (item as any)[field] = req.body[field];
      }
    }

    await item.save();
    return res.status(200).json(item);
  } catch (err) {
    const error = err as Error;
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    next(err);
  }
};

// DELETE /api/items/mine — delete all items owned by the signed-in user
export const deleteMyItems: AsyncHandler = async (req, res, next) => {
  try {
    const result = await Item.deleteMany({ owner: req.user._id });
    return res.status(200).json({ deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id — delete an item owned by the signed-in user only
export const deleteItem: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid item id' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (String(item.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You are not the owner of this item' });
    }

    await Item.deleteOne({ _id: item._id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { Item };
