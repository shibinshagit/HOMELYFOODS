"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store"
import {
  removeFromCart,
  updateQuantity,
  setOrderType,
  setCustomerInfo,
  submitOrder,
  clearCart,
} from "@/lib/store/slices/orderSlice"
import { useSettings } from "@/lib/contexts/settings-context"
import { useAuth } from "@/lib/contexts/auth-context"
import Navbar from "@/components/ui/navbar"
import LoginModal from "@/components/auth/login-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function OrderPage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { cart, total, orderType, customerInfo, loading } = useSelector((state: RootState) => state.order)
  const { formatPrice } = useSettings()
  const { isAuthenticated, user } = useAuth()
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Set default order type to 'delivery' on mount
  useEffect(() => {
    if (orderType !== "delivery") {
      dispatch(setOrderType("delivery"))
    }
    // eslint-disable-next-line
  }, [])

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(id))
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity }))
    }
  }

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (cart.length === 0) return

    const orderData = {
      customerName: user?.name || customerInfo.name,
      customerEmail: user?.email || customerInfo.email,
      customerPhone: customerInfo.phone,
      orderType,
      tableNumber: customerInfo.tableNumber,
      deliveryAddress: customerInfo.deliveryAddress,
      totalAmount: total,
      specialInstructions,
      userId: user?.id,
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: item.menuItem.price,
        specialRequests: item.specialRequests,
      })),
    }

    try {
      const result = await dispatch(submitOrder(orderData)).unwrap()
      alert(`Order placed successfully! Order ID: ${result.orderId}`)
      router.push("/dashboard/orders")
    } catch (error) {
      console.error("Failed to submit order:", error)
      alert("Failed to place order. Please try again.")
    }
  }

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return

    const customerName = user?.name || customerInfo.name || "Customer"
    const customerPhone = customerInfo.phone || "Not provided"
    const customerEmail = user?.email || customerInfo.email || "Not provided"

    let message = `🍽️ *New Order Request*\n\n`
    message += `👤 *Customer Details:*\n`
    message += `Name: ${customerName}\n`
    message += `Phone: ${customerPhone}\n`
    message += `Email: ${customerEmail}\n\n`

    message += `📋 *Order Type:* ${orderType.charAt(0).toUpperCase() + orderType.slice(1)}\n`

    if (orderType === "dine-in" && customerInfo.tableNumber) {
      message += `🪑 *Table Number:* ${customerInfo.tableNumber}\n`
    }

    if (orderType === "delivery" && customerInfo.deliveryAddress) {
      message += `📍 *Delivery Address:* ${customerInfo.deliveryAddress}\n`
    }

    message += `\n🛒 *Order Items:*\n`
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.menuItem.name} x${item.quantity} - ${formatPrice(item.menuItem.price * item.quantity)}\n`
    })

    const deliveryFee = orderType === "delivery" ? 3.99 : 0
    const finalTotal = total + deliveryFee

    message += `\n💰 *Order Summary:*\n`
    message += `Subtotal: ${formatPrice(total)}\n`
    if (deliveryFee > 0) {
      message += `Delivery Fee: ${formatPrice(deliveryFee)}\n`
    }
    message += `*Total: ${formatPrice(finalTotal)}*\n`

    if (specialInstructions) {
      message += `\n📝 *Special Instructions:*\n${specialInstructions}\n`
    }

    message += `\nPlease confirm this order and let me know the estimated preparation time. Thank you! 🙏`

    const phoneNumber = "+917012975494" // Replace with actual restaurant WhatsApp number
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    window.open(whatsappUrl, "_blank")
  }

  const deliveryFee = orderType === "delivery" ? 3.99 : 0
  const finalTotal = total + deliveryFee

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-2 py-12">
          <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 text-center border border-amber-100">
            <ShoppingCart className="w-20 h-20 text-amber-200 mx-auto mb-6 animate-bounce" />
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2 font-playfair">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some items from our products to get started!</p>
            <Button onClick={() => router.push("/products")} className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold px-8 py-3 rounded-lg text-lg shadow-md">
              BUY NOW!
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex flex-col">
      <Navbar />
      <div className="w-full mt-16 max-w-6xl mx-auto px-2 sm:px-4 py-4 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Cart & Details */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Cart Items */}
          <Card className="rounded-2xl shadow-xl border-amber-100 bg-white/90">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-amber-700">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-xl bg-amber-50/40">
                  <Image
                    src={item.menuItem.image_url || `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.menuItem.name) || "/placeholder.svg"}`}
                    alt={item.menuItem.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover shadow-md"
                  />
                  <div className="flex-1 w-full min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.menuItem.name}</h3>
                    <p className="text-gray-600 text-sm">{formatPrice(item.menuItem.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.menuItem.id, item.quantity - 1)}
                      className="rounded-full border-amber-300"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.menuItem.id, item.quantity + 1)}
                      className="rounded-full border-amber-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold text-amber-700">{formatPrice(item.menuItem.price * item.quantity)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(removeFromCart(item.menuItem.id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Type */}
          <Card className="rounded-2xl shadow-xl border-amber-100 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-700">Order Type</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={orderType} onValueChange={(value) => dispatch(setOrderType(value as any))} className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dine-in" id="dine-in" />
                  <Label htmlFor="dine-in">Dine In</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="takeaway" id="takeaway" />
                  <Label htmlFor="takeaway">Takeaway</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="rounded-2xl shadow-xl border-amber-100 bg-white/90">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-700">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">
                    Logged in as: <strong>{user?.name || user?.email}</strong>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={user?.name || customerInfo.name}
                    onChange={(e) => dispatch(setCustomerInfo({ name: e.target.value }))}
                    disabled={!!user?.name}
                    required
                    className="rounded-lg border-amber-200"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => dispatch(setCustomerInfo({ phone: e.target.value }))}
                    required
                    className="rounded-lg border-amber-200"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || customerInfo.email}
                  onChange={(e) => dispatch(setCustomerInfo({ email: e.target.value }))}
                  disabled={!!user?.email}
                  className="rounded-lg border-amber-200"
                />
              </div>
              {orderType === "dine-in" && (
                <div>
                  <Label htmlFor="table">Table Number</Label>
                  <Input
                    id="table"
                    type="number"
                    value={customerInfo.tableNumber || ""}
                    onChange={(e) =>
                      dispatch(setCustomerInfo({ tableNumber: Number.parseInt(e.target.value) || undefined }))
                    }
                    className="rounded-lg border-amber-200"
                  />
                </div>
              )}
              {orderType === "delivery" && (
                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    value={customerInfo.deliveryAddress || ""}
                    onChange={(e) => dispatch(setCustomerInfo({ deliveryAddress: e.target.value }))}
                    required
                    className="rounded-lg border-amber-200"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests or dietary requirements..."
                  className="rounded-lg border-amber-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Order Summary */}
        <div className="w-full md:w-[380px] lg:w-[400px] flex-shrink-0">
          <Card className="rounded-2xl shadow-2xl border-amber-100 bg-white/95 sticky top-24 md:top-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-700">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span>{formatPrice(item.menuItem.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
              <Button
                onClick={handleWhatsAppOrder}
                disabled={loading || (!isAuthenticated && !customerInfo.name) || !customerInfo.phone}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-3 rounded-lg text-lg shadow-md"
              >
                {loading ? "Processing..." : isAuthenticated ? "Place Order" : "Place Order"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500"></span>
                </div>
              </div>
              {/* <Button
                onClick={handleWhatsAppOrder}
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50 bg-transparent font-bold py-3 rounded-lg text-lg"
                disabled={!customerInfo.name || !customerInfo.phone}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Order via WhatsApp
              </Button> */}
              {/* <Button variant="outline" onClick={() => dispatch(clearCart())} className="w-full font-bold py-3 rounded-lg text-lg">
                Clear Cart
              </Button> */}
            </CardContent>
          </Card>
        </div>
      </div>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login to Place Order"
        description="Please login to place your order and track its status."
      />
    </div>
  )
}
