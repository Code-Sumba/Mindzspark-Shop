import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import razorpay from '../config/razorpay.js';
import dayjs from 'dayjs';
import crypto from 'crypto';
import AddressModel from '../models/address.model.js';

export async function CashOnDeliveryOrderController(request,response){
    try {
        
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId,subTotalAmt } = request.body 

        // Fetch full address details
        const addressDoc = await AddressModel.findById(addressId);
        const addressDetails = addressDoc ? {
          address_line: addressDoc.address_line,
          city: addressDoc.city,
          state: addressDoc.state,
          pincode: addressDoc.pincode,
          country: addressDoc.country,
          mobile: addressDoc.mobile?.toString() || ''
        } : {};

        const now = dayjs().format('ddd, D MMM YY');
        const nowFull = dayjs().format('ddd, D MMM YY - h:mma');
        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : `ORD-${new mongoose.Types.ObjectId()}`,
                productId : el.productId._id, 
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                } ,
                paymentId : "",
                payment_status : "CASH ON DELIVERY",
                delivery_address : addressId ,
                delivery_address_details: addressDetails,
                subTotalAmt  : subTotalAmt,
                totalAmt  :  totalAmt,
                statusUpdates: [
                  {
                    title: 'Order Confirmed',
                    date: now,
                    details: [
                      'Your Order has been placed.',
                      nowFull
                    ]
                  }
                ]
            })
        })

        const generatedOrder = await OrderModel.insertMany(payload)

        ///remove from the cart
        const removeCartItems = await CartProductModel.deleteMany({ userId : userId })
        const updateInUser = await UserModel.updateOne({ _id : userId }, { shopping_cart : []})

        return response.json({
            message : "Order successfully",
            error : false,
            success : true,
            data : generatedOrder
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error ,
            error : true,
            success : false
        })
    }
}

export async function createRazorpayOrder(req, res){
    try {
        const userId = req.userId // auth middleware 
        const {list_items, totalAmt, addressId, subTotalAmt, currency, receipt, notes} = req.body;
        if(!totalAmt || !subTotalAmt){
            return res.status(400).json({ success:false, message:"Missing required fields"});
        }

        // Fetch full address details
        const addressDoc = await AddressModel.findById(addressId);
        const addressDetails = addressDoc ? {
          address_line: addressDoc.address_line,
          city: addressDoc.city,
          state: addressDoc.state,
          pincode: addressDoc.pincode,
          country: addressDoc.country,
          mobile: addressDoc.mobile?.toString() || ''
        } : {};

        const options = {
            amount: totalAmt*100,
            currency,
            receipt,
            notes
        }
        const order = await razorpay.orders.create(options);
        const now = dayjs().format('ddd, D MMM YY');
        const nowFull = dayjs().format('ddd, D MMM YY - h:mma');
        const payload = list_items.map(el => {
            return({
                userId : userId,
                orderId : order.id,
                productId : el.productId._id, 
                product_details : {
                    name : el.productId.name,
                    image : el.productId.image
                } ,
                paymentId : "",
                payment_status : "ORDER CREATED AT RAZORPAY",
                delivery_address : addressId ,
                delivery_address_details: addressDetails,
                subTotalAmt  : subTotalAmt,
                totalAmt  :  totalAmt,
                statusUpdates: [
                  {
                    title: 'Order Confirmed',
                    date: now,
                    details: [
                      'Your Order has been placed.',
                      nowFull
                    ]
                  }
                ]
            })
        })
        const generatedOrder = await OrderModel.insertMany(payload)
        return res.status(200).json({success:true, order});
    } catch (error) {
        console.log("Error in createRazorpayOrder:", error);
        return res.status(400).json({success:false, message:"Unable to create order, Please try again Later."})        
    }
}

export async function verifyRazorpayPayment(req, res){
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            return res.status(400).json({success:false, message:"Missing Payment Info."});
        }
        console.log("working")
        const generatedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
              .update(`${razorpay_order_id}|${razorpay_payment_id}`)
              .digest('hex');
        
        if(generatedSignature != razorpay_signature){
            return res.status(400).json({success:false, message:"Invalid Signature."})
        }
        const order = await OrderModel.findOne({ razorpay_order_id });
        order.payment_status = "PAID";
        order.paymentId = razorpay_payment_id;
        order.updatedAt = new Date();
        await order.save();
        
        return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error("Error in verifyPayment:", error);
        return res.status(500).json({ success: false, message: 'Server Error', error });
    }
}

export const handleWebhook = (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest === req.headers['x-razorpay-signature']) {
    console.log('Webhook verified successfully');
    return res.status(200).json({ status: 'ok' });
  } else {
    return res.status(400).json({ status: 'invalid signature' });
  }
};

export async function paymentController(request,response){
    try {
        // Razorpay order creation logic stub
        // Example:
        // const options = {
        //   amount: totalAmt * 100, // amount in smallest currency unit
        //   currency: 'INR',
        //   receipt: 'order_rcptid_11',
        // };
        // const order = await razorpay.orders.create(options);
        // return response.status(200).json(order);
        response.status(501).json({ message: 'Razorpay integration pending', success: false });
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function getOrderDetailsController(request,response){
    try {
        const userId = request.userId // order id

        const orderlist = await OrderModel.find({ userId : userId }).sort({ createdAt : -1 }).populate('delivery_address')

        return response.json({
            message : "order list",
            data : orderlist,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function addOrderStatusUpdate(req, res) {
  try {
    const { orderId, title, details } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
    const update = {
      title,
      date: dateStr,
      details: Array.isArray(details) ? details : [details]
    };
    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      { $push: { statusUpdates: update } },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function backfillOrderDeliveryAddresses(req, res) {
  try {
    const orders = await OrderModel.find({ delivery_address: { $exists: true }, $or: [ { delivery_address_details: { $exists: false } }, { delivery_address_details: null } ] });
    let updatedCount = 0;
    for (const order of orders) {
      if (!order.delivery_address) continue;
      const addressDoc = await AddressModel.findById(order.delivery_address);
      if (!addressDoc) continue;
      order.delivery_address_details = {
        address_line: addressDoc.address_line,
        city: addressDoc.city,
        state: addressDoc.state,
        pincode: addressDoc.pincode,
        country: addressDoc.country,
        mobile: addressDoc.mobile?.toString() || ''
      };
      await order.save();
      updatedCount++;
    }
    res.json({ success: true, updated: updatedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAllOrdersController(req, res) {
  try {
    // Check if user is admin
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await UserModel.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    const orders = await OrderModel.find().sort({ createdAt: -1 })
      .populate('userId', 'name email mobile')
      .populate('delivery_address');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTodayOrdersController(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await UserModel.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const orders = await OrderModel.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email mobile')
      .populate('delivery_address');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
