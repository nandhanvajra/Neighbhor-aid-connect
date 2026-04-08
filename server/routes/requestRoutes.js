const express = require("express");
const router = express.Router();
const Request = require("../models/requestSchema");
const User = require("../models/userSchema");
const { auth } = require("../middleware/auth");
router.post("/", auth, async (req, res) => {
  console.log("Received request creation with data:", req.body);
  try {
    const user = await User.findById(req.user.userId).select(
      "name userType blockedUsers",
    );
    if (user.userType === "worker") {
      return res.status(403).json({
        success: false,
        message:
          "Workers cannot create help requests. Only residents can post requests.",
      });
    }
    const { category, description, urgency, preferredTime, addressNote } =
      req.body;
    console.log(category);
    const newRequest = new Request({
      userId: req.user.userId,
      category,
      description,
      urgency,
      preferredTime,
      addressNote: addressNote || "",
      requestedWorkerId: req.body.staffMemberId || null,
    });
    console.log("Created new request object:", newRequest);
    const savedRequest = await newRequest.save();
    console.log("Saved request to database with ID:", savedRequest._id);
    if (req.io) {
      req.io.emit("newHelpRequest", {
        requestId: savedRequest._id,
        category,
        description,
        urgency,
        preferredTime,
        addressNote,
        fromUserId: req.user.userId,
      });
      if (req.body.staffMemberId) {
        req.io.to(req.body.staffMemberId).emit("directServiceRequest", {
          requestId: savedRequest._id,
          category,
          description,
          urgency,
          preferredTime,
          addressNote,
          fromUserId: req.user.userId,
          fromUserName: user.name || "A resident",
          staffMemberId: req.body.staffMemberId,
          staffMemberName: req.body.staffMemberName,
        });
      }
    }
    res.status(201).json({
      success: true,
      message: "Help request created successfully",
      request: savedRequest,
    });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
const mapWorkerProfessionToCategory = (profession) => {
  const mapping = {
    electrician: "electrical",
    plumber: "plumbing",
    maid: "maid",
    cook: "cook",
    cleaner: "cleaning",
    gardener: "gardening",
    security: "security",
    maintenance: "maintenance",
    carpenter: "maintenance",
    other: null,
  };
  return mapping[profession] !== undefined ? mapping[profession] : null;
};
router.get("/all", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select(
      "userType job blockedUsers requestPreferences",
    );
    let query = {};
    if (currentUser.userType === "worker") {
      if (
        currentUser.requestPreferences &&
        currentUser.requestPreferences.length > 0
      ) {
        query.category = {
          $in: currentUser.requestPreferences,
        };
      } else {
        const category = mapWorkerProfessionToCategory(currentUser.job);
        if (category) {
          query.category = category;
        } else {
          return res.status(200).json({
            success: true,
            requests: [],
          });
        }
      }
      query.$or = [
        {
          requestedWorkerId: {
            $exists: false,
          },
        },
        {
          requestedWorkerId: null,
        },
        {
          requestedWorkerId: currentUser._id,
        },
      ];
    }
    const requests = await Request.find(query)
      .populate("userId", "name email job role userType blockedUsers")
      .populate("completedBy", "name email job role userType blockedUsers");
    const filteredRequests = requests.filter((request) => {
      if (!request.userId) return false;
      const requesterId = request.userId._id
        ? request.userId._id.toString()
        : request.userId.toString();
      const currentUserId = req.user.userId.toString();
      if (currentUser.blockedUsers && currentUser.blockedUsers.length > 0) {
        const blockedIds = currentUser.blockedUsers.map((id) => id.toString());
        if (blockedIds.includes(requesterId)) {
          return false;
        }
      }
      if (
        request.userId.blockedUsers &&
        request.userId.blockedUsers.length > 0
      ) {
        const requesterBlockedIds = request.userId.blockedUsers.map((id) =>
          id.toString(),
        );
        if (requesterBlockedIds.includes(currentUserId)) {
          return false;
        }
      }
      return true;
    });
    const requestsWithUserNames = filteredRequests.map((request) => ({
      ...request.toObject(),
      userId: request.userId ? request.userId._id.toString() : request.userId,
      userName: request.userId ? request.userId.name : "Unknown User",
      userEmail: request.userId ? request.userId.email : "",
      userJob: request.userId ? request.userId.job : "",
      userRole: request.userId ? request.userId.role : "",
      userType: request.userId ? request.userId.userType : "",
      completedBy: request.completedBy
        ? request.completedBy._id.toString()
        : request.completedBy,
      completedByName: request.completedBy
        ? request.completedBy.name
        : "Volunteer",
    }));
    res.status(200).json({
      success: true,
      requests: requestsWithUserNames,
    });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.get("/allusers", auth, async (req, res) => {
  try {
    const requests = await User.find();
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.get("/", auth, async (req, res) => {
  try {
    const requests = await Request.find({
      userId: req.user.userId,
    }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.get("/:id", auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this request",
      });
    }
    res.status(200).json({
      success: true,
      request,
    });
  } catch (err) {
    console.error("Get request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      category,
      description,
      urgency,
      preferredTime,
      addressNote,
      completedBy,
      status,
    } = req.body;
    let request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    const isOfferingHelp =
      completedBy !== undefined && status === "in-progress";
    if (!isOfferingHelp && request.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request",
        isOfferingHelp: isOfferingHelp,
        requestUserId: request.userId,
        currentUserId: req.user.userId,
      });
    }
    const updateObj = {
      updatedAt: Date.now(),
    };
    if (category !== undefined) updateObj.category = category;
    if (description !== undefined) updateObj.description = description;
    if (urgency !== undefined) updateObj.urgency = urgency;
    if (preferredTime !== undefined) updateObj.preferredTime = preferredTime;
    if (addressNote !== undefined) updateObj.addressNote = addressNote;
    if (completedBy !== undefined) updateObj.completedBy = completedBy;
    if (status !== undefined) updateObj.status = status;
    console.log("Updating request with:", updateObj);
    request = await Request.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
    });
    if (req.io && isOfferingHelp) {
      req.io.to(request.userId.toString()).emit("requestHelp", {
        requestId: request._id,
        helper: req.user.userId,
        status: "in-progress",
      });
    }
    res.status(200).json({
      success: true,
      message: "Request updated successfully",
      request,
    });
  } catch (err) {
    console.error("Update request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.delete("/:id", auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request",
      });
    }
    await Request.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (err) {
    console.error("Delete request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
router.patch("/:id/rate", auth, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }
    if (request.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to rate this request",
      });
    }
    if (request.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed requests",
      });
    }
    if (request.rating && request.rating.stars) {
      return res.status(400).json({
        success: false,
        message: "Request already rated",
      });
    }
    request.rating = {
      stars: rating,
      review: "",
      ratedBy: req.user.userId,
      ratedAt: new Date(),
    };
    await request.save();
    if (request.completedBy) {
      const helper = await User.findById(request.completedBy);
      if (helper) {
        await helper.updateRatingStats(rating);
      }
    }
    res.status(200).json({
      success: true,
      message: "Rating submitted",
      request,
    });
  } catch (err) {
    console.error("Rate request error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
module.exports = router;
