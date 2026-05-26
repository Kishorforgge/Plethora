import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';

/**
 * @desc    List conversations for the current user
 * @route   GET /api/discussions
 * @access  Private
 */
export const getMyConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username fullName profilePicture')
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'username fullName profilePicture');

        const otherParticipants = (conv.participants as any[]).filter(
          (p) => p._id.toString() !== req.user!._id.toString()
        );

        return {
          _id: conv._id,
          title: conv.title,
          participants: conv.participants,
          otherParticipants,
          lastMessage,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      })
    );

    res.status(200).json({ status: 'success', results: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a conversation with one or more users
 * @route   POST /api/discussions
 * @access  Private
 */
export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { participantIds, title, initialMessage } = req.body;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400);
      return next(new Error('At least one other participant is required.'));
    }

    const uniqueIds = [...new Set(participantIds.map((id: string) => id.toString()))].filter(
      (id) => id !== req.user!._id.toString()
    );

    if (uniqueIds.length === 0) {
      res.status(400);
      return next(new Error('You must include at least one other user.'));
    }

    const usersExist = await User.countDocuments({ _id: { $in: uniqueIds } });
    if (usersExist !== uniqueIds.length) {
      res.status(404);
      return next(new Error('One or more participants were not found.'));
    }

    const allParticipants = [req.user._id, ...uniqueIds];

    const conversation = await Conversation.create({
      title: title?.trim() || '',
      participants: allParticipants,
      lastMessageAt: new Date(),
    });

    if (initialMessage && typeof initialMessage === 'string' && initialMessage.trim()) {
      await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        text: initialMessage.trim(),
      });
    }

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'username fullName profilePicture'
    );

    res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get messages in a conversation
 * @route   GET /api/discussions/:id/messages
 * @access  Private
 */
export const getConversationMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const conversation = await Conversation.findById(req.params.id).populate(
      'participants',
      'username fullName profilePicture'
    );
    if (!conversation) {
      res.status(404);
      return next(new Error('Conversation not found.'));
    }

    const isParticipant = conversation.participants.some(
      (p) => (typeof p === 'object' && '_id' in p ? p._id : p).toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      res.status(403);
      return next(new Error('You are not a participant in this conversation.'));
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'username fullName profilePicture')
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/discussions/:id/messages
 * @access  Private
 */
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { text } = req.body;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400);
      return next(new Error('Message text is required.'));
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      res.status(404);
      return next(new Error('Conversation not found.'));
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      res.status(403);
      return next(new Error('You are not a participant in this conversation.'));
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'username fullName profilePicture'
    );

    res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    next(error);
  }
};
