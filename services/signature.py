import sys
import cv2
import base64
import os
import uuid
from skimage.metrics import structural_similarity as ssim

# TODO add contour detection for enhanced accuracy


def match(source, target):
    # read the images
    source_data = base64.b64decode(source)
    source_fn = str(uuid.uuid1()) + '.jpg'
    source_file = os.path.dirname(os.path.abspath(__file__)) + '/../tmp/'+ source_fn
    with open(source_file, 'wb') as f:
        f.write(source_data)

    target_data = base64.b64decode(target)
    target_fn = str(uuid.uuid1()) + '.jpg'
    target_file = os.path.dirname(os.path.abspath(__file__)) + '/../tmp/'+ target_fn
    with open(target_file, 'wb') as f:
        f.write(target_data)

    img1 = cv2.imread(source_file)
    img2 = cv2.imread(target_file)

    # turn images to grayscale
    img1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    img2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # remove tmp files
    os.remove(source_file)
    os.remove(target_file)

    # resize images for comparison
    img1 = cv2.resize(img1, (300, 300))
    img2 = cv2.resize(img2, (300, 300))

    similarity_value = "{:.2f}".format(ssim(img1, img2)*100)

    return float(similarity_value)

ans = match(sys.argv[1], sys.argv[2])
print(ans)
