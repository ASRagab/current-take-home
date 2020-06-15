import { Router, Request, Response } from 'express'
import { isRight, Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js'
import Controller from './controller'
import { Dependencies } from '../environment'
import { asyncHandler } from '../middleware'
import MerchantRepository from '../repositories/merchantRepository'
import { PlaceDetail } from '../models'

export default class MerchantController implements Controller {
  public path = '/merchants'

  public router = Router()

  private merchants: MerchantRepository

  private places: Client

  constructor(public deps: Dependencies, private readonly apiKey: string) {
    this.merchants = deps.repositories.merchants
    this.places = deps.places

    this.registerRoutes()
  }

  private registerRoutes = () => {
    this.router.put(`/merchants/:merchantId/update`, asyncHandler(this.updateMerchant))
  }

  private getPlacesDetail = async (merchantId: string): Promise<Either<string, PlaceDetail>> => {
    try {
      const latLng = await this.merchants.getLatLong(merchantId)

      if (isLeft(latLng)) {
        return left(latLng.left)
      }

      const { name, latitude, longitude } = latLng.right

      const data = await this.places.findPlaceFromText({
        params: {
          key: this.apiKey,
          input: name,
          fields: ['formatted_address', 'name', 'place_id'],
          inputtype: PlaceInputType.textQuery,
          locationbias: `point:${latitude},${longitude}`
        }
      })

      const maybeCandidate = data.data.candidates[0]

      const detail: PlaceDetail = {
        placeId: maybeCandidate.place_id,
        name: maybeCandidate.name,
        formattedAdress: maybeCandidate.formatted_address
      }

      return right(detail)
    } catch (e) {
      return left(e)
    }
  }

  private updateMerchant = async (req: Request, res: Response) => {
    const { merchantId } = req.params

    if (!merchantId) {
      res.status(400).json({ code: 201, message: `No merchantId provided` })
    } else {
      try {
        const data = await this.getPlacesDetail(merchantId)

        if (isLeft(data)) {
          res.status(400).json({ code: 202, message: data.left })
        } else {
          this.merchants
            .updateMerchant(merchantId, data.right)
            .then(updated =>
              isRight(updated)
                ? res.status(200).json({ code: 0, message: updated.right })
                : res.status(400).json({ code: 203, message: updated.left })
            )
            .catch(err => res.status(500).json({ code: -1, message: err }))
        }
      } catch (e) {
        res.status(500).json({ code: 204, message: e })
      }
    }
  }
}
