import { Router } from 'express';
import { videoController } from '../controllers/video.controller';

const videoRouter = Router();

videoRouter.post('/presign-upload', videoController.presignUpload);
videoRouter.post('/', videoController.create);
videoRouter.get('/my', videoController.myList);
videoRouter.get('/', videoController.list);

export { videoRouter };
