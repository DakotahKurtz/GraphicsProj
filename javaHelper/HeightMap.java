package heightMap;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

/*
    Translate a grayscale png into a height map (for terrain mesh)
    User defines xz dimension and y-scale

    outputs a 2d array of [x,y,z] values, where x,z are just desiredDim / numPixels and
    y is determined by pixel value
 */

public class HeightMap
{
    public static void main(String[] args) throws IOException
    {
        String path = "/Users/dakotahkurtz/Downloads/36_246_-112_268_13_1500_1500.png";

        BufferedImage image = ImageIO.read(new File(path));
        int width = image.getWidth();
        int height = image.getHeight();
        System.out.println("Width: " + width + ", height: " + height);
        Pixel[][] pixels = new Pixel[width][height];

        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;

        for (int i = 0; i < width; i++)
        {
            for (int j = 0; j < height; j++)
            {
                pixels[i][j] = new Pixel(image.getRGB(i, j));
                min = Math.min(min, pixels[i][j].b);
                max = Math.max(max, pixels[i][j].b);
            }
        }

        /*
6.3 x 6.3km - 4.21m/px resolution, Height range: -1,685.055 m to 8,749.195 m
Height range: 2,728.371 m to 8,750.25 m

In Unreal Engine, on import, a z scaling of 1,176.15 should be used for 1:1 height scaling using a normalised image.

x and y scales should be set to 421.29

For 3D printing, the height range is 6,021.879 m and height/width ratio is 0.953

i.e. if you printed this 100mm wide, it would have to be 95.293mm tall to be physically accurate
         */
        double realXspan = 9.1;
        double realZspan = 9.1;
        double minElevation = 0;
        double maxElevation = 1;
        double realYspan = maxElevation - minElevation;

        double incXZ = realXspan / width;
        double incY = realYspan / (max - min);

        double[][][] meshPoints = new double[width][height][3];

        for (int i = 0; i < width; i++)
        {
            for (int j = 0; j < height; j++)
            {
                meshPoints[i][j] = new double[]{
                        realXspan * (i / ((double) width) - .5),
                        realYspan + incY * (pixels[i][j].r - min),
                        realZspan * (j / ((double) height) - .5)
                };
            }
        }

        int sampleSize = 100;
        for (int i = 0; i < sampleSize; i++) {
            for (int j = 0; j < sampleSize; j++) {
                System.out.printf("(%f, %f, %f), ", meshPoints[i][j][0],
                        meshPoints[i][j][1], meshPoints[i][j][2]);
            }
            System.out.printf("\n");
        }

        String outFile = "/Users/dakotahkurtz/Spring25/Graphics/finalProject" +
                "/terrainDataRaw.js";
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outFile))) {
            writer.write("const terrainDataRaw = [");
            for (int i = 0; i < width; i++) {
                writer.write("[");
                for (int j = 0; j < height; j++) {
                    writer.write("[" +
                            meshPoints[i][j][0] + ", " + meshPoints[i][j][1] + ", " + meshPoints[i][j][2] + "], ");
                    if (j % 20 == 0) {
                        writer.write("\n");
                    }
                }
                writer.write("],\n\n");
            }
            writer.write("]");
            writer.flush();
            writer.close();

            System.out.println("File written");
        }
    }


    private static class Pixel
    {
        int r;
        int g;
        int b;

        private Pixel(int threeBytes)
        {
            this.r = (threeBytes >> 16) & 0xff;
            this.g = (threeBytes >> 8) & 0xff;
            this.b = (threeBytes) & 0xff;
        }

        @Override
        public String toString()
        {
            return "(" + r + ", " + g + ", " + b + ")";
        }

    }
}
