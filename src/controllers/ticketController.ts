import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Seat from '~/models/seatModel'
import TicketCatalog from '~/models/ticketCatalogModel'
import Ticket from '~/models/ticketModel'
import Trip from '~/models/tripModel'
import Location from '~/models/locationModel'

// Get All
export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find()
      .populate({
        path: 'seat_id',
        select: 'name status',
        populate: {
          path: 'seat_catalog_id',
          select: 'name',
          populate: {
            path: 'vehicle_id',
            select: 'name status'
          }
        }
      })

      .populate('ticket_catalog_id', 'name')
      .populate({
        path: 'trip_id',
        select: '-createAt -updateAt -__v',
        populate: [
          { path: 'departure_point', select: 'name' },
          { path: 'destination_point', select: 'name' }
        ]
      })

    res.status(200).json({ message: 'Lấy danh sách vé thành công!', tickets })
  } catch (error) {
    console.error({ message: 'Lỗi khi lấy danh sách vé!', error })
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}
// Get By ID
export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'ID không hợp lệ!' })
      return
    }
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'seat_id',
        select: 'name status',
        populate: {
          path: 'seat_catalog_id',
          select: 'name',
          populate: {
            path: 'vehicle_id',
            select: 'name status'
          }
        }
      })

      .populate('ticket_catalog_id', 'name')
      .populate({
        path: 'trip_id',
        select: '-createAt -updateAt -__v',
        populate: [
          { path: 'departure_point', select: 'name' },
          { path: 'destination_point', select: 'name' }
        ]
      })
    if (!ticket) {
      res.status(404).json({ message: 'Vé không tồn tại!' })
      return
    }

    res.status(200).json({ message: 'Lấy vé theo ID thành công!', ticket })
  } catch (error) {
    console.error({ message: 'Lỗi khi lấy vé!', error })
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}

// Post
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const newTicket = new Ticket(req.body)
    const savedTicket = await newTicket.save()

    res.status(201).json({ message: 'Tạo vé thành công!', ticket: savedTicket })
  } catch (error) {
    console.error({ message: 'Lỗi khi tạo vé!', error })
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}

// Put
export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('seat_id')
      .populate('ticket_catalog_id')
      .populate('trip_id')

    if (!updatedTicket) {
      res.status(404).json({ message: 'Vé không tồn tại!' })
      return
    }

    res.status(200).json({ message: 'Cập nhật vé thành công!', ticket: updatedTicket })
  } catch (error) {
    console.error({ message: 'Lỗi khi cập nhật vé!', error })
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}

// Delete
export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id)

    if (!deletedTicket) {
      res.status(404).json({ message: 'Vé không tồn tại!' })
      return
    }

    res.status(200).json({ message: 'Xóa vé thành công!' })
  } catch (error) {
    console.error({ message: 'Lỗi khi xóa vé!', error })
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}
//Search
export const searchTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticket_catalog_name, seat_name, departure_point_name, destination_point_name } = req.query

    const query: { [key: string]: any } = {}

    if (ticket_catalog_name) {
      const ticketCatalogs = await TicketCatalog.find({ name: { $regex: ticket_catalog_name, $options: 'i' } })
      if (ticketCatalogs.length > 0) {
        query.ticket_catalog_id = { $in: ticketCatalogs.map((tc) => tc._id) }
      }
    }

    if (seat_name) {
      const seats = await Seat.find({ name: { $regex: seat_name, $options: 'i' } })
      if (seats.length > 0) {
        query.seat_id = { $in: seats.map((s) => s._id) }
      }
    }

    let tripQuery: { [key: string]: any } = {}

    if (departure_point_name) {
      tripQuery['departure_point'] = await Location.findOne({ name: { $regex: departure_point_name, $options: 'i' } })
    }

    if (destination_point_name) {
      tripQuery['destination_point'] = await Location.findOne({
        name: { $regex: destination_point_name, $options: 'i' }
      })
    }

    if (Object.keys(tripQuery).length > 0) {
      const trips = await Trip.find(tripQuery)
      if (trips.length > 0) {
        query.trip_id = { $in: trips.map((t) => t._id) }
      }
    }

    if (Object.keys(query).length === 0) {
      res.status(404).json({ message: 'Không tìm thấy vé nào!' })
      return
    }

    const tickets = await Ticket.find(query).populate('ticket_catalog_id seat_id trip_id')
    console.log(query)

    if (tickets.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy vé nào!' })
      return
    }

    res.status(200).json({ message: 'Tìm kiếm vé thành công!', tickets })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi máy chủ!' })
  }
}
