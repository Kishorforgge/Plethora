import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { notifyUser } from '../socket';

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

    const { type } = req.query;
    let query: any = {};
    if (type === 'public') {
      query = { isPublic: true };
    } else if (type === 'private') {
      query = {
        $or: [
          { isPublic: false },
          { isPublic: { $exists: false } }
        ],
        participants: req.user._id
      };
    } else {
      query = {
        $or: [
          { isPublic: true },
          { participants: req.user._id }
        ]
      };
    }

    const conversations = await Conversation.find(query)
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
  const { participantIds, title, initialMessage, isPublic } = req.body;

  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    if (isPublic) {
      if (!title || !title.trim()) {
        res.status(400);
        return next(new Error('Room title is required for public discussions.'));
      }
      const conversation = await Conversation.create({
        title: title.trim(),
        participants: [req.user._id],
        isPublic: true,
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
      return;
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

    if (populated) {
      // Notify participants
      populated.participants.forEach((p: any) => {
        notifyUser(p._id.toString(), 'conversation_created', populated);
      });
    }

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

    const isParticipant = conversation.isPublic || conversation.participants.some(
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

    let isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      if (conversation.isPublic) {
        conversation.participants.push(req.user._id);
        await conversation.save();
        isParticipant = true;
      } else {
        res.status(403);
        return next(new Error('You are not a participant in this conversation.'));
      }
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

    // Notify conversation participants
    conversation.participants.forEach((participantId) => {
      notifyUser(participantId.toString(), 'new_message', populated);
    });

    res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a message in a conversation
 * @route   PATCH /api/discussions/messages/:messageId
 * @access  Private
 */
export const editMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      res.status(404);
      return next(new Error('Message not found.'));
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('You are not authorized to edit this message.'));
    }

    message.text = text.trim();
    message.edited = true;
    await message.save();

    const populated = await Message.findById(message._id).populate(
      'sender',
      'username fullName profilePicture'
    );

    res.status(200).json({ status: 'success', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message in a conversation
 * @route   DELETE /api/discussions/messages/:messageId
 * @access  Private
 */
export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      res.status(404);
      return next(new Error('Message not found.'));
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('You are not authorized to delete this message.'));
    }

    await message.deleteOne();

    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
