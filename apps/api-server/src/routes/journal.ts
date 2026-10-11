import { Router, type IRouter } from "express";
import { JournalPostModel, getNextSequence } from "@workspace/db";
import {
  ListJournalPostsQueryParams,
  ListJournalPostsResponse,
  CreateJournalPostBody,
  GetJournalPostParams,
  GetJournalPostResponse,
  UpdateJournalPostParams,
  UpdateJournalPostBody,
  UpdateJournalPostResponse,
  DeleteJournalPostParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/journal", async (req, res): Promise<void> => {
  const query = ListJournalPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const filter: Record<string, any> = {};
  if (query.data.category !== undefined) {
    filter.category = query.data.category;
  }
  if (query.data.published !== undefined) {
    filter.published = query.data.published;
  }
  if (query.data.tag !== undefined) {
    filter.tags = { $regex: query.data.tag, $options: "i" };
  }

  try {
    const posts = await JournalPostModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(ListJournalPostsResponse.parse(posts.map(serializeDates)));
  } catch {
    res.json([]);
  }
});

router.post("/journal", async (req, res): Promise<void> => {
  const parsed = CreateJournalPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = await getNextSequence("journal_posts");
  const post = await JournalPostModel.create({ ...parsed.data, id });
  res.status(201).json(GetJournalPostResponse.parse(serializeDates(post.toObject())));
});

router.get("/journal/:id", async (req, res): Promise<void> => {
  const params = GetJournalPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const post = await JournalPostModel.findOne({ id: params.data.id }).lean();
    if (!post) {
      res.status(404).json({ error: "Journal post not found" });
      return;
    }
    res.json(GetJournalPostResponse.parse(serializeDates(post)));
  } catch {
    res.status(404).json({ error: "Journal post not found" });
  }
});

router.patch("/journal/:id", async (req, res): Promise<void> => {
  const params = UpdateJournalPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateJournalPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const post = await JournalPostModel.findOneAndUpdate(
    { id: params.data.id },
    { $set: { ...parsed.data, updatedAt: new Date() } },
    { new: true }
  ).lean();
  if (!post) {
    res.status(404).json({ error: "Journal post not found" });
    return;
  }
  res.json(UpdateJournalPostResponse.parse(serializeDates(post)));
});

router.delete("/journal/:id", async (req, res): Promise<void> => {
  const params = DeleteJournalPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const post = await JournalPostModel.findOneAndDelete({ id: params.data.id }).lean();
  if (!post) {
    res.status(404).json({ error: "Journal post not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
