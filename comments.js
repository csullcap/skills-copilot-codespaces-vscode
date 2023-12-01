// Create web server

// Import modules
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Import models
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

// @route   GET /comments
// @desc    Get all comments
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const comments = await Comment.find().sort({ date: -1 });
        res.json(comments);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /comments/:id
// @desc    Get comment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        res.json(comment);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   POST /comments
// @desc    Create a comment
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('content', 'Content is required').not().isEmpty(),
            check('post', 'Post is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() }); // Bad request
        }

        // Destructure request body
        const { content, post } = req.body;

        try {
            // Check if post exists
            const postExists = await Post.findById(post);
            if (!postExists) {
                return res.status(404).json({ msg: 'Post not found' });
            }

            // Create comment
            const comment = new Comment({
                content,
                post,
                user: req.user.id
            });

            // Save comment
            await comment.save();

            // Add comment to post
            postExists.comments.unshift(comment.id);
            await postExists.save();

            // Return comment
            res.json(comment);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server error');
        }
    }
);

