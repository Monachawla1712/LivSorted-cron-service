import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {DARK_STORE_REQUISITIONS_TABLE_NAME} from "./dm.constants";

@Entity({ name: DARK_STORE_REQUISITIONS_TABLE_NAME })
export class DarkStoreRequisitionsWhEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    wh_id: number;

    @Column()
    store_id: number;

    @Column()
    sku_code: string;

    @Column()
    grade: string;

    @Column()
    date: Date;

    @Column()
    dispatched_qty: number;

    @Column()
    rejection: number;

    @Column()
    created_on: number;
}
