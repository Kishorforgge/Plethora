import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { onlineUsers, notifyUser } from '../socket';

/**
 * @desc    Get all private conversations for current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    const currentUserId = req.user._id;

    // Find all conversations that are NOT public and contain the current user as a participant
    const conversations = await Conversation.find({
      isPublic: { $ne: true },
      participants: currentUserId
    })
      .populate('participants', 'username fullName profilePicture')
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(
      conversations.map(async (conv) => {
        // Find the other participant in this 1-on-1 private message
        const otherParticipant = (conv.participants as any[]).find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        if (!otherParticipant) return null;

        // Fetch last message text
        const lastMessageObj = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 });

        // Calculate unread count (where sender is not current user and read is false)
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: currentUserId },
          read: false
        });

        const isOnline = onlineUsers.has(otherParticipant._id.toString());

        return {
          _id: conv._id,
          userId: otherParticipant._id,
          username: otherParticipant.username,
          profilePicture: otherParticipant.profilePicture,
          isOnline,
          lastMessage: lastMessageObj ? lastMessageObj.text : '',
          unreadCount
        };
      })
    );

    // Filter out invalid null items
    const filteredData = data.filter(Boolean);

    res.status(200).json({ status: 'success', data: filteredData });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or create a private conversation with a user
 * @route   POST /api/messages/conversation
 * @access  Private
 */
export const getOrCreateConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user?._id;

  try {
    if (!currentUserId) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    if (!targetUserId) {
      res.status(400);
      return next(new Error('Target user ID is required.'));
    }

        // Check if direct conversation already exists
    let conversation = await Conversation.findOne({
      isPublic: { $ne: true },
      participants: { $all: [currentUserId, targetUserId] }
    });

    let isNew = false;
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, targetUserId],
        isPublic: false,
        lastMessageAt: new Date()
      });
      isNew = true;
    }

    const populated = await Conversation.findById(conversation._id).populate(
      'participants',
      'username fullName profilePicture'
    );

    if (isNew) {
      notifyUser(targetUserId.toString(), 'conversation_created', populated);
    }

    res.status(201).json({ status: 'success', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all messages in conversation as read
 * @route   PUT /api/messages/conversations/:id/read
 * @access  Private
 */
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const conversationId = req.params.id;
  const currentUserId = req.user?._id;

  try {
    if (!currentUserId) {
      res.status(401);
      return next(new Error('Not authorized.'));
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        read: false
      },
      { read: true }
    );

    res.status(200).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
