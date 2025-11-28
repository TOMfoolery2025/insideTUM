-- CreateEnum
CREATE TYPE "Faculty" AS ENUM ('CIT', 'SOM');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('CIT_CS', 'CIT_AI', 'CIT_EE', 'SOM_MGMT', 'SOM_FIN', 'SOM_ECON');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "program" "Program",
DROP COLUMN "faculty",
ADD COLUMN     "faculty" "Faculty";

