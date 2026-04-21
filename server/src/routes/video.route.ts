import { Router } from 'express';
import { videoController } from '../controllers/video.controller';

const videoRouter = Router();

videoRouter.post('/presign-upload', videoController.presignUpload);
videoRouter.post('/', videoController.create);
videoRouter.put('/:id', videoController.update);
videoRouter.post('/:id/purchase', videoController.purchase);
videoRouter.get('/my', videoController.myList);
videoRouter.get('/my-purchases', videoController.myPurchases);
videoRouter.get('/market', videoController.marketList);
videoRouter.get('/market/:id', videoController.marketGet);
videoRouter.get('/:id', videoController.getOne);
videoRouter.get('/', videoController.list);

export { videoRouter };
